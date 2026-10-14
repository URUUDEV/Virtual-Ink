import { ApiError } from './errors.ts';

// One bounded counter per Node worker, shared by all protected read routes.
// No token/IP retention, no queue, and no trust in forwarded client headers.
// This is a development resource ceiling, not distributed rate limiting.
export function createAdmission(maximum = 16) {
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 256) throw new Error('Invalid admission ceiling.');
  let active = 0;
  return Object.freeze({
    async run<T>(work: () => Promise<T>): Promise<T> {
      if (active >= maximum) throw new ApiError('SERVICE_BUSY');
      active++;
      try { return await work(); }
      finally { active--; }
    },
  });
}
