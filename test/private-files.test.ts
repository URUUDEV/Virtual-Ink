import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer, type Socket } from 'node:net';
import test, { type TestContext } from 'node:test';
import { ApiError } from '../src/backend/api/errors.ts';
import { createClamAvScanner, type ClamAvOptions } from '../src/backend/storage/clamav.ts';
import { createFileInspector, MAX_INSPECTION_BYTES, type ScanResult } from '../src/backend/storage/file-inspection.ts';

const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const receipt = (bytes: Uint8Array, verdict: ScanResult['verdict'] = 'clean'): ScanResult => ({ verdict, sha256: hash(bytes) });
const config: ClamAvOptions = { host: '127.0.0.1', port: 3310, timeoutMs: 1000, maxBytes: MAX_INSPECTION_BYTES, concurrency: 1 };

async function daemon(t: TestContext, handler: (socket: Socket) => void) {
  const sockets = new Set<Socket>();
  const server = createServer(socket => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.once('close', () => sockets.delete(socket));
    handler(socket);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  const address = server.address();
  assert(address && typeof address === 'object');
  return address.port;
}

function receive(socket: Socket, complete: (bytes: Buffer) => void) {
  let data = Buffer.alloc(0), command = false;
  const chunks: Buffer[] = [];
  socket.on('data', (chunk: Buffer) => {
    data = Buffer.concat([data, chunk]);
    if (!command) {
      if (data.length < 10) return;
      assert.equal(data.subarray(0, 10).toString(), 'zINSTREAM\0');
      data = data.subarray(10); command = true;
    }
    while (data.length >= 4) {
      const size = data.readUInt32BE(0);
      if (data.length < size + 4) return;
      chunks.push(data.subarray(4, size + 4)); data = data.subarray(size + 4);
      if (size === 0) { assert.equal(data.length, 0); complete(Buffer.concat(chunks)); return; }
    }
  });
}

test('inspection hashes owned bytes, admits only matching signatures and returns immutable safe metadata', async () => {
  const inspect = createFileInspector({ scan: async bytes => receipt(bytes) }, 1024);
  for (const [bytes, mime] of [[pdf, 'application/pdf'], [png, 'image/png'], [jpeg, 'image/jpeg']] as const) {
    const result = await inspect(bytes, mime);
    assert.deepEqual(result, { status: 'SAFE', reason: 'checks_passed', size: bytes.length, sha256: hash(bytes), mime });
    assert(Object.isFrozen(result));
  }
  assert.equal((await inspect(Buffer.from(pdf), 'application/pdf')).sha256, hash(pdf));
});

test('inspection rejects empty/oversized inputs before invoking the scanner', async () => {
  let calls = 0;
  const inspect = createFileInspector({ scan: async bytes => { calls++; return receipt(bytes); } }, pdf.length);
  for (const bytes of [Buffer.alloc(0), Buffer.alloc(pdf.length + 1)]) {
    const result = await inspect(bytes, 'application/pdf');
    assert.equal(result.status, 'REJECTED'); assert.equal(result.reason, 'invalid_size');
    assert.equal(result.sha256, ''); assert.equal(result.mime, null);
  }
  assert.equal(calls, 0);
  assert.equal((await inspect(pdf, 'application/pdf')).status, 'SAFE');
});

test('inspection rejects MIME spoofing, renamed executables, archives, active SVG and malformed signatures', async () => {
  let calls = 0;
  const inspect = createFileInspector({ scan: async bytes => { calls++; return receipt(bytes); } }, 1024);
  const highBit = Buffer.from(pdf); highBit[0] |= 0x80;
  const badPng = Buffer.from(png); badPng[12] |= 0x80;
  for (const bytes of [Buffer.from('MZ renamed.pdf'), Buffer.from('PK fake.png'), Buffer.from('<svg onload="x()"/>'),
    Buffer.from('%PDF-1.7\nmissing trailer'), highBit, badPng, Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    Buffer.concat([pdf, Buffer.from('appended executable')])]) {
    const result = await inspect(bytes, 'application/pdf');
    assert.equal(result.status, 'REJECTED'); assert.equal(result.reason, 'type_mismatch');
  }
  for (const mime of ['image/png', 'application/pdf; charset=utf-8', 'APPLICATION/PDF', '', undefined]) {
    assert.equal((await inspect(pdf, mime as string)).status, 'REJECTED');
  }
  assert.equal(calls, 0);
});

test('inspection fails closed on malware, exceptions, missing/mismatched receipts and unknown verdicts', async () => {
  for (const verdict of ['clean', 'infected', 'unavailable'] as const) {
    const result = await createFileInspector({ scan: async bytes => receipt(bytes, verdict) }, 1024)(pdf, 'application/pdf');
    assert.equal(result.status, verdict === 'clean' ? 'SAFE' : verdict === 'infected' ? 'REJECTED' : 'REVIEW_REQUIRED');
    assert.equal(result.reason, verdict === 'clean' ? 'checks_passed' : verdict === 'infected' ? 'malware' : 'scanner_unavailable');
  }
  for (const scan of [async () => { throw new Error('private path/secret/provider diagnostic'); },
    async () => undefined as unknown as ScanResult,
    async () => ({ verdict: 'clean', sha256: '0'.repeat(64) }) as ScanResult,
    async bytes => ({ ...receipt(bytes), verdict: 'unexpected' }) as unknown as ScanResult]) {
    const result = await createFileInspector({ scan }, 1024)(pdf, 'application/pdf');
    assert.equal(result.status, 'REVIEW_REQUIRED');
    assert(!/private|secret|diagnostic/.test(JSON.stringify(result)));
  }
});

test('inspection binds verdicts to copied bytes and denies scanner mutation', async () => {
  const caller = Buffer.from(pdf);
  const inspect = createFileInspector({ scan: async bytes => {
    caller.fill(0); return receipt(bytes);
  } }, 1024);
  assert.equal((await inspect(caller, 'application/pdf')).sha256, hash(pdf));
  const mutate = createFileInspector({ scan: async bytes => { const result = receipt(bytes); bytes.fill(0); return result; } }, 1024);
  assert.equal((await mutate(pdf, 'application/pdf')).status, 'REVIEW_REQUIRED');
  assert.equal(pdf.toString().startsWith('%PDF'), true);
});

test('inspection validates its worker ceiling and refuses shared or untyped memory', async () => {
  const scanner = { scan: async bytes => receipt(bytes) };
  for (const limit of [0, -1, 1.5, NaN, Infinity, MAX_INSPECTION_BYTES + 1]) {
    assert.throws(() => createFileInspector(scanner, limit), ApiError);
  }
  const inspect = createFileInspector(scanner, 1024);
  await assert.rejects(inspect('not bytes' as unknown as Uint8Array, 'application/pdf'), ApiError);
  await assert.rejects(inspect(new Uint8Array(new SharedArrayBuffer(32)), 'application/pdf'), ApiError);
});

test('ClamAV configuration rejects non-loopback endpoints, invalid budgets and unbounded concurrency', () => {
  for (const patch of [{ host: 'scanner.invalid' }, { host: 'localhost' }, { host: '0.0.0.0' }, { port: 0 },
    { port: 65536 }, { port: 1.2 }, { timeoutMs: 0 }, { timeoutMs: 30001 }, { maxBytes: 0 },
    { maxBytes: MAX_INSPECTION_BYTES + 1 }, { concurrency: 0 }, { concurrency: 5 }]) {
    assert.throws(() => createClamAvScanner({ ...config, ...patch } as ClamAvOptions), ApiError);
  }
  assert(Object.isFrozen(createClamAvScanner({ ...config, host: '::1' })));
});

test('ClamAV INSTREAM sends exact bounded binary chunks and accepts a fragmented clean reply', async t => {
  const bytes = Buffer.alloc(40000, 0xab); bytes[0] = 0; bytes[1] = 0xff;
  const port = await daemon(t, socket => receive(socket, value => {
    assert.deepEqual(value, bytes);
    socket.write('stream: '); socket.end('OK\0');
  }));
  const scanner = createClamAvScanner({ ...config, port });
  assert.deepEqual(await scanner.scan(bytes), receipt(bytes));
});

test('ClamAV detects a positive malware reply without exposing its signature', async t => {
  const port = await daemon(t, socket => receive(socket, () => socket.end('stream: Win.Test.EICAR_HDB-1 FOUND\0')));
  assert.deepEqual(await createClamAvScanner({ ...config, port }).scan(pdf), receipt(pdf, 'infected'));
});

test('ClamAV never accepts errors, extra records, missing terminators, overflow or unsolicited clean replies', async t => {
  for (const reply of ['stream: OK', 'stream: OK\n', 'stream: OK\0stream: OK\0', 'stream: INSTREAM size limit exceeded. ERROR\0',
    'stream: private-secret ERROR\0', 'stream: OK\0private', 'x'.repeat(1025), 'stream:  FOUND\0']) {
    const port = await daemon(t, socket => receive(socket, () => socket.end(reply)));
    assert.equal((await createClamAvScanner({ ...config, port }).scan(pdf)).verdict, 'unavailable');
  }
  const early = await daemon(t, socket => socket.end('stream: OK\0'));
  assert.equal((await createClamAvScanner({ ...config, port: early }).scan(Buffer.alloc(MAX_INSPECTION_BYTES))).verdict, 'unavailable');
});

test('ClamAV bounds concurrent work, releases reservations after timeout and rejects partial/closed replies', async t => {
  let requests = 0;
  const port = await daemon(t, socket => { requests++; receive(socket, () => {}); });
  const scanner = createClamAvScanner({ ...config, port, timeoutMs: 30 });
  const pending = scanner.scan(pdf);
  assert.deepEqual(await scanner.scan(pdf), { verdict: 'unavailable', sha256: '' });
  assert.equal((await pending).verdict, 'unavailable');
  assert.equal((await scanner.scan(pdf)).verdict, 'unavailable');
  assert.equal(requests, 2);
  for (const reply of ['', 'stream: O']) {
    const closing = await daemon(t, socket => receive(socket, () => socket.end(reply)));
    assert.equal((await createClamAvScanner({ ...config, port: closing }).scan(pdf)).verdict, 'unavailable');
  }
});

test('ClamAV denies unavailable connections and invalid inputs without a scan', async t => {
  const port = await daemon(t, socket => socket.destroy());
  assert.equal((await createClamAvScanner({ ...config, port }).scan(pdf)).verdict, 'unavailable');
  const scanner = createClamAvScanner({ ...config, maxBytes: pdf.length });
  for (const bytes of [Buffer.alloc(0), Buffer.alloc(pdf.length + 1), new Uint8Array(new SharedArrayBuffer(1)), 'bad']) {
    assert.deepEqual(await scanner.scan(bytes as Uint8Array), { verdict: 'unavailable', sha256: '' });
  }
});

test('private-file pipeline integrates real sockets with fixed redacted inspection outcomes', async t => {
  for (const [reply, expected] of [['stream: OK\0', 'SAFE'], ['stream: Test.Malware FOUND\0', 'REJECTED'],
    ['provider unavailable', 'REVIEW_REQUIRED']] as const) {
    const port = await daemon(t, socket => receive(socket, value => { assert.deepEqual(value, pdf); socket.end(reply); }));
    const result = await createFileInspector(createClamAvScanner({ ...config, port }), 1024)(pdf, 'application/pdf');
    assert.equal(result.status, expected); assert.equal(result.sha256, hash(pdf));
  }
});
