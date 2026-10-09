// Receive a token through a pipe from a hidden prompt/secret manager. Never accept
// it as a command argument, print it, or store it in a file/environment variable.
export async function readPrivateToken(input: import('node:stream').Readable = process.stdin): Promise<string> {
  if ('isTTY' in input && input.isTTY) throw new Error('Use a private piped token source.');
  const chunks: Buffer[] = [];
  let size = 0;
  const timer = setTimeout(() => input.destroy(new Error('Token input timed out.')), 30000);
  try {
    for await (const chunk of input) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > 8194) throw new Error('Invalid token input.');
      chunks.push(bytes);
    }
    const token = Buffer.concat(chunks).toString('utf8').trim();
    if (!/^[A-Za-z0-9._~-]{1,8192}$/.test(token)) throw new Error('Invalid token input.');
    return token;
  } finally { clearTimeout(timer); }
}
