import { ApiError } from '../api/errors.ts';
import { strictObject } from '../api/validation.ts';
export function validateDemoProbe(payload: unknown): Readonly<{ demo: true }> {
  const value = strictObject(payload, ['demo']);
  if (value.demo !== true) throw new ApiError('VALIDATION_FAILED', ['demo']);
  return Object.freeze({ demo: true });
}
// Infrastructure fixture only; no customer data or external actions.
export function executeDemoProbe(payload: unknown) {
  validateDemoProbe(payload);
  return Object.freeze({ kind: 'system.probe', status: 'completed', demo: true });
}
