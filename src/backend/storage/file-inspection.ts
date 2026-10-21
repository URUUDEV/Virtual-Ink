import { createHash } from 'node:crypto';
import { ApiError } from '../api/errors.ts';

// Conservative worker ceiling, not an approved customer upload allowance.
export const MAX_INSPECTION_BYTES = 25 * 1024 * 1024;
export type ScanResult = Readonly<{ verdict: 'clean' | 'infected' | 'unavailable'; sha256: string }>;
export type MalwareScanner = Readonly<{ scan(bytes: Uint8Array): Promise<ScanResult> }>;
export type Inspection = Readonly<{
  status: 'SAFE' | 'REJECTED' | 'REVIEW_REQUIRED';
  reason: 'checks_passed' | 'invalid_size' | 'type_mismatch' | 'malware' | 'scanner_unavailable';
  size: number; sha256: string; mime: 'application/pdf' | 'image/png' | 'image/jpeg' | null;
}>;

function detectedMime(bytes: Buffer): Inspection['mime'] {
  // Signature checks are admission filters, not full decoders or PDF sanitizers.
  if (bytes.length >= 16 && /^%PDF-(?:1\.[0-7]|2\.0)[\r\n]/.test(bytes.subarray(0, 9).toString('latin1')) &&
    /%%EOF[\r\n ]*$/.test(bytes.subarray(-32).toString('latin1'))) return 'application/pdf';
  if (bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) &&
    bytes.readUInt32BE(8) === 13 && bytes.subarray(12, 16).equals(Buffer.from('IHDR')) &&
    bytes.subarray(-12).equals(Buffer.from('0000000049454e44ae426082', 'hex'))) return 'image/png';
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) return 'image/jpeg';
  return null;
}

/** Worker-only content decision. SAFE never grants access or promotes an object.
 * The caller must read an immutable quarantine version, persist this result and
 * its audit atomically, then separately authorize any promotion/download.
 * No filename, object location, provider diagnostics or customer metadata returns.
 */
export function createFileInspector(scanner: MalwareScanner, maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_INSPECTION_BYTES) {
    throw new ApiError('VALIDATION_FAILED', ['maxBytes']);
  }
  return async (input: Uint8Array, declaredMime: string): Promise<Inspection> => {
    if (!(input instanceof Uint8Array) || input.buffer instanceof SharedArrayBuffer) {
      throw new ApiError('VALIDATION_FAILED', ['bytes']);
    }
    // Reject before copying/hashing unbounded content; no useful hash on size denial.
    if (input.byteLength === 0 || input.byteLength > maxBytes) {
      return Object.freeze({ status: 'REJECTED', reason: 'invalid_size', size: input.byteLength, sha256: '', mime: null });
    }
    const bytes = Buffer.from(input); // Own the bytes before any asynchronous work.
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const mime = detectedMime(bytes);
    const result = (status: Inspection['status'], reason: Inspection['reason']): Inspection =>
      Object.freeze({ status, reason, size: bytes.length, sha256, mime });
    if (mime === null || mime !== declaredMime) return result('REJECTED', 'type_mismatch');
    try {
      const scan = await scanner.scan(bytes);
      // A broken/misbound worker receipt cannot mark different bytes clean.
      if (scan?.sha256 !== sha256 || createHash('sha256').update(bytes).digest('hex') !== sha256) {
        return result('REVIEW_REQUIRED', 'scanner_unavailable');
      }
      if (scan.verdict === 'infected') return result('REJECTED', 'malware');
      if (scan.verdict === 'clean') return result('SAFE', 'checks_passed');
    } catch { /* Provider diagnostics are deliberately not retained. */ }
    return result('REVIEW_REQUIRED', 'scanner_unavailable');
  };
}
