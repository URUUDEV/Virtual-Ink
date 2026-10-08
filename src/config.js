import { isIP } from 'node:net';

// Read only named settings; never include environment values in errors or logs.
export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const host = env.HOST ?? '127.0.0.1';
  const portText = env.PORT ?? '3000';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  if (typeof host !== 'string' || isIP(host) === 0) {
    throw new Error('HOST must be an IPv4 or IPv6 address.');
  }
  if (typeof portText !== 'string' || !/^\d{1,5}$/.test(portText)) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  const port = Number(portText);
  if (port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }

  return Object.freeze({ nodeEnv, host, port });
}
