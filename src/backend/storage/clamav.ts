import { createHash } from 'node:crypto';
import { createConnection } from 'node:net';
import { ApiError } from '../api/errors.ts';
import { MAX_INSPECTION_BYTES, type MalwareScanner, type ScanResult } from './file-inspection.ts';

export type ClamAvOptions = Readonly<{
  host: '127.0.0.1' | '::1'; port: number; timeoutMs: number; maxBytes: number; concurrency: number;
}>;

/** Private worker sidecar only. clamd TCP has no authentication or encryption:
 * never accept an endpoint from a request or expose its port to the network.
 * No path commands, shell, command interpolation, retries or cached verdicts.
 */
export function createClamAvScanner(options: ClamAvOptions): MalwareScanner {
  const { host, port, timeoutMs, maxBytes, concurrency } = options;
  if (!['127.0.0.1', '::1'].includes(host) || !Number.isInteger(port) || port < 1 || port > 65535 ||
    !Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > 30_000 ||
    !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_INSPECTION_BYTES ||
    !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) {
    throw new ApiError('VALIDATION_FAILED', ['scanner']);
  }
  let active = 0;
  return Object.freeze({
    async scan(input: Uint8Array): Promise<ScanResult> {
      if (!(input instanceof Uint8Array) || input.buffer instanceof SharedArrayBuffer ||
        input.byteLength < 1 || input.byteLength > maxBytes || active >= concurrency) {
        return Object.freeze({ verdict: 'unavailable', sha256: '' });
      }
      active++;
      const bytes = Buffer.from(input);
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      try {
        const verdict = await new Promise<ScanResult['verdict']>((resolve) => {
          const socket = createConnection({ host, port });
          let settled = false, sent = false;
          let response = Buffer.alloc(0);
          const finish = (value: ScanResult['verdict']) => {
            if (settled) return;
            settled = true;
            clearTimeout(deadline);
            socket.destroy();
            resolve(value);
          };
          // Absolute deadline includes connection, writes and reply, even trickle input.
          const deadline = setTimeout(() => finish('unavailable'), timeoutMs);
          socket.on('error', () => finish('unavailable'));
          socket.on('close', () => finish('unavailable'));
          socket.on('data', (chunk: Buffer) => {
            if (!sent || response.length + chunk.length > 1024) { finish('unavailable'); return; }
            response = Buffer.concat([response, chunk]);
          });
          socket.on('end', () => {
            const reply = response.toString('utf8');
            if (sent && reply === 'stream: OK\0') finish('clean');
            else if (sent && /^stream: [A-Za-z0-9_.:-]{1,200} FOUND\0$/.test(reply)) finish('infected');
            else finish('unavailable');
          });
          const write = (data: Buffer): Promise<void> => new Promise((accept, reject) => {
            socket.write(data, (error) => error ? reject(error) : accept());
          });
          socket.once('connect', () => {
            void (async () => {
              await write(Buffer.from('zINSTREAM\0'));
              // Await each write callback: bounded chunks and bounded queued memory.
              for (let offset = 0; offset < bytes.length && !settled; offset += 16 * 1024) {
                const chunk = bytes.subarray(offset, offset + 16 * 1024);
                const length = Buffer.alloc(4);
                length.writeUInt32BE(chunk.length);
                await write(Buffer.concat([length, chunk]));
              }
              if (!settled) { sent = true; await write(Buffer.alloc(4)); }
            })().catch(() => finish('unavailable'));
          });
        });
        return Object.freeze({ verdict, sha256 });
      } finally { active--; }
    },
  });
}
