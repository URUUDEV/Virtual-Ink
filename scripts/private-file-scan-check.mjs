import assert from 'node:assert/strict';
import { createClamAvScanner } from '../src/backend/storage/clamav.ts';
import { createFileInspector } from '../src/backend/storage/file-inspection.ts';

// Explicit operator check against a local sidecar. No file paths, credentials,
// customer bytes or arbitrary endpoints accepted; EICAR stays in memory.
const portText = process.argv[2] ?? '3310';
if (process.argv.length > 3 || !/^\d{1,5}$/.test(portText)) throw new Error('Expected one loopback scanner port.');
const scanner = createClamAvScanner({ host: '127.0.0.1', port: Number(portText),
  timeoutMs: 30_000, maxBytes: 1024 * 1024, concurrency: 1 });
const inspect = createFileInspector(scanner, 1024 * 1024);
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const eicar = Buffer.from('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=', 'base64');
// A bare EICAR string pasted into a PDF is not the standard positive control.
// Use an actual PDF EmbeddedFile stream so the engine extracts the 68-byte file.
function attachmentPdf(attachment) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R /Names << /EmbeddedFiles << /Names [(eicar.com) 4 0 R] >> >> >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 72 72] /Resources << >> >>',
    '<< /Type /Filespec /F (eicar.com) /EF << /F 5 0 R >> >>',
    `<< /Type /EmbeddedFile /Length ${attachment.length} >>\nstream\n${attachment.toString('ascii')}\nendstream`,
  ];
  let document = '%PDF-1.7\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(document);
  document += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`;
  return Buffer.from(`${document}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
const infectedPdf = attachmentPdf(eicar);
const checks = [
  ['clean PDF', await inspect(pdf, 'application/pdf'), 'SAFE'],
  ['clean PNG', await inspect(png, 'image/png'), 'SAFE'],
  ['renamed executable', await inspect(Buffer.from('MZ renamed.pdf'), 'application/pdf'), 'REJECTED'],
  ['EICAR PDF', await inspect(infectedPdf, 'application/pdf'), 'REJECTED'],
];
for (const [name, result, expected] of checks) assert.equal(result.status, expected, name);
assert.equal(checks[3][1].reason, 'malware');
assert.equal((await scanner.scan(eicar)).verdict, 'infected', 'raw EICAR scanner detection');
console.log(JSON.stringify({ scope: 'local_clamav_synthetic_content_only', passed: 5,
  cases: checks.map(([name, result]) => ({ name, status: result.status, reason: result.reason })),
  limits: 'No hosted storage, promotion, durable audit, download, Auth or production acceptance.' }, null, 2));
