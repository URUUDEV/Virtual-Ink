export const MAX_UPSTREAM_JSON_BYTES = 1024 * 1024;

// Release rejected provider responses without reading private error payloads or
// waiting indefinitely for cancellation. Cancellation failure is not authority.
export function discardUpstreamBody(response: Response): void {
  void response.body?.cancel().catch(() => {});
}

// Bound actual decoded bytes, not just Content-Length (which may be absent or
// describe compressed bytes). Callers map all failures to their safe API errors.
export async function readUpstreamJson(response: Response): Promise<unknown> {
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_UPSTREAM_JSON_BYTES)) {
    discardUpstreamBody(response);
    throw new Error('Provider JSON exceeds the size contract.');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Provider JSON is missing.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_UPSTREAM_JSON_BYTES) {
        void reader.cancel().catch(() => {});
        throw new Error('Provider JSON exceeds the size contract.');
      }
      chunks.push(value);
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
  } finally { reader.releaseLock(); }
}
