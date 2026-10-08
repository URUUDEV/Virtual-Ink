const errors = {
  INVALID_JSON: { status: 400, message: 'Request body must be valid JSON.' },
  VALIDATION_FAILED: { status: 400, message: 'Request validation failed.' },
  UNAUTHENTICATED: { status: 401, message: 'Authentication is required.' },
  FORBIDDEN: { status: 403, message: 'This action is not permitted.' },
  NOT_FOUND: { status: 404, message: 'Resource not found.' },
  METHOD_NOT_ALLOWED: { status: 405, message: 'Method not allowed.' },
  CONFLICT: { status: 409, message: 'The request conflicts with the current state.' },
  PAYLOAD_TOO_LARGE: { status: 413, message: 'Request body is too large.' },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: 'Content-Type must be application/json.' },
  AUDIT_UNAVAILABLE: { status: 503, message: 'Required audit recording is unavailable.' },
  INTERNAL_ERROR: { status: 500, message: 'An unexpected error occurred.' },
} as const;
export type ErrorCode = keyof typeof errors;
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields: readonly string[];
  constructor(code: ErrorCode, fields: readonly string[] = []) {
    super(errors[code].message);
    this.name = 'ApiError'; this.code = code; this.status = errors[code].status;
    // Fields must be server-authored schema paths, never client keys or values.
    this.fields = Object.freeze([...fields]);
  }
}
export function safeError(error: unknown) {
  const known = error instanceof ApiError ? error : new ApiError('INTERNAL_ERROR');
  return { status: known.status, body: { code: known.code, message: known.message,
    ...(known.fields.length ? { fields: known.fields } : {}) } };
}
