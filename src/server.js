import { createApp } from './app.js';
import { loadConfig } from './config.js';

function logger(event) {
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`);
}

let config;
try {
  config = loadConfig();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ event: 'configuration_invalid', message: error.message })}\n`);
  process.exit(1);
}

const server = createApp({ logger });
server.on('error', () => {
  process.stderr.write(`${JSON.stringify({ event: 'server_error' })}\n`);
  process.exitCode = 1;
});

server.listen(config.port, config.host, () => {
  logger({ event: 'server_started', service: 'Virtual Ink', host: config.host, port: config.port });
});

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => {
    server.closeAllConnections();
    process.exitCode = 1;
  }, 5_000);
  deadline.unref();
  server.close(() => {
    clearTimeout(deadline);
    logger({ event: 'server_stopped', service: 'Virtual Ink' });
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
