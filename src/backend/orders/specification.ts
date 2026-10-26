import { ApiError } from '../api/errors.ts';
import { strictObject } from '../api/validation.ts';
import { documentChoices, parseDocumentPrint } from '../../shared/document-print.ts';

// Versioned document orders retain choices directly; no invented product code,
// dimensions, quantity or client-supplied financial authority.
export function validateOrderSpecification(value: unknown): Record<string, unknown> {
  const spec = strictObject(value, ['kind', 'schemaVersion', 'pages', 'copies', ...Object.keys(documentChoices),
    'productCode', 'quantity', 'widthMm', 'heightMm']);
  const invalid = () => new ApiError('VALIDATION_FAILED', ['spec']);
  if (Object.hasOwn(spec, 'kind')) {
    if (spec.kind !== 'document' || spec.schemaVersion !== 1 ||
      typeof spec.pages !== 'number' || typeof spec.copies !== 'number') throw invalid();
    const { kind, schemaVersion, ...options } = spec;
    try { return { kind, schemaVersion, ...parseDocumentPrint(options) }; }
    catch { throw invalid(); }
  }
  if (Object.keys(spec).length !== 4 || typeof spec.productCode !== 'string' ||
    !/^[a-z][a-z0-9_-]{2,63}$/.test(spec.productCode)) throw invalid();
  for (const key of ['quantity', 'widthMm', 'heightMm']) {
    if (!Number.isInteger(spec[key]) || (spec[key] as number) < 1 || (spec[key] as number) > 10000) throw invalid();
  }
  return { ...spec };
}
