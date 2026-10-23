import test from 'node:test';
import assert from 'node:assert/strict';
import { documentChoices, documentDraftText, documentPrintSummary, parseDocumentPrint } from '../src/shared/document-print.ts';

const input = { pages: '5', copies: '3', purpose: 'assignment', paperSize: 'a4', paperType: 'standard', colour: 'mono', sides: 'double', binding: 'spiral', urgency: 'standard', handoff: 'collection' };

test('document specifications count each duplex copy separately and never calculate a price', () => {
  const spec = parseDocumentPrint(input);
  assert.equal(spec.pages, 5); assert.equal(spec.copies, 3);
  const summary = documentPrintSummary(spec);
  assert.equal(summary.printedPages, 15); assert.equal(summary.sheets, 9);
  assert.equal(documentPrintSummary({ ...spec, sides: 'single' }).sheets, 15);
  assert.equal(documentPrintSummary({ ...spec, pages: 6 }).sheets, 9);
  assert.equal(documentPrintSummary({ ...spec, pages: 2000, copies: 1000 }).printedPages, 2000000);
  assert.equal(Object.hasOwn(summary, 'price'), false);
  assert.match(documentDraftText(spec), /NOT SUBMITTED/);
  assert.match(documentDraftText(spec), /Price: Quotation required/);
  assert.match(documentDraftText(spec), /Spiral bound/);
});

test('document counts reject blank, fractional, unbounded and coercible values', () => {
  for (const key of ['pages', 'copies']) {
    for (const value of ['', '0', '-1', '1.5', '1e2', ' 2 ', '01', '10000', 0, -1, 1.5, NaN, Infinity, null, true, [], {}, { valueOf: () => 2 }]) {
      assert.throws(() => parseDocumentPrint({ ...input, [key]: value }), /whole number/);
    }
    assert.throws(() => parseDocumentPrint({ ...input, [key]: key === 'pages' ? 2001 : 1001 }));
  }
});

test('document specifications reject injected authority, unknown choices and inherited fields', () => {
  for (const value of [undefined, null, [], true, 'draft', {}, { ...input, total: 1 }, { ...input, orderId: 'forged' }, Object.create(input)]) {
    assert.throws(() => parseDocumentPrint(value));
  }
  for (const [key, group] of Object.entries(documentChoices)) {
    for (const option of Object.keys(group.options)) {
      const spec = parseDocumentPrint({ ...input, [key]: option });
      assert.ok(documentPrintSummary(spec).rows.some(([, title]) => title === group.options[option as keyof typeof group.options]));
    }
    for (const value of ['__proto__', 'constructor', '<script>alert(1)</script>', 'https://private.invalid/file', [], null, { toString: () => Object.keys(group.options)[0] }]) {
      assert.throws(() => parseDocumentPrint({ ...input, [key]: value }), /Choose an available option/);
    }
  }
  assert.throws(() => documentDraftText({ ...parseDocumentPrint(input), colour: '<script>' }));
  const text = documentDraftText(parseDocumentPrint(input));
  assert.doesNotMatch(text, /orderId|paymentUrl|storage|access_token|fileName/);
});
