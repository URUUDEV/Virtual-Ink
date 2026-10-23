// A local specification only. This module never calculates money or submits orders.
export const documentChoices = {
  purpose: { label: 'What are you printing?', options: { assignment: 'Assignment or report', notes: 'Study notes', dissertation: 'Dissertation or thesis', business: 'Business documents', other: 'Other documents' } },
  paperSize: { label: 'Paper size', options: { a4: 'A4', a3: 'A3', letter: 'Letter' } },
  paperType: { label: 'Paper', options: { standard: 'Standard white paper', heavy: 'Heavier white paper', premium: 'Premium paper — confirm with vendor' } },
  colour: { label: 'Print colour', options: { mono: 'Black and white', colour: 'Full colour' } },
  sides: { label: 'Printed sides', options: { single: 'Single-sided', double: 'Double-sided' } },
  binding: { label: 'Binding and finishing', options: { none: 'Loose sheets', staple: 'Stapled', spiral: 'Spiral bound', softcover: 'Soft cover bound' } },
  urgency: { label: 'Turnaround', options: { standard: 'Standard — vendor to confirm', urgent: 'Urgent — availability to confirm' } },
  handoff: { label: 'How would you like to receive it?', options: { collection: 'Collect from vendor', delivery: 'Delivery — quotation required' } },
} as const;
export type DocumentChoice = keyof typeof documentChoices;
export type DocumentPrintSpec = { pages: number; copies: number } & Record<DocumentChoice, string>;
const choiceKeys = Object.keys(documentChoices) as DocumentChoice[];
const keys = ['pages', 'copies', ...choiceKeys];

export function parseDocumentPrint(value: unknown): DocumentPrintSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Check your print options.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== keys.length || keys.some(key => !Object.hasOwn(input, key))) throw new Error('Check your print options.');
  function count(key: 'pages' | 'copies', maximum: number) {
    const raw = input[key];
    const number = typeof raw === 'string' && /^[1-9]\d{0,3}$/.test(raw) ? Number(raw) : raw;
    if (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 1 || number > maximum) {
      throw new Error(`${key === 'pages' ? 'Pages per copy' : 'Copies'} must be a whole number from 1 to ${maximum}.`);
    }
    return number;
  }
  const spec = { pages: count('pages', 2000), copies: count('copies', 1000) } as DocumentPrintSpec;
  for (const key of choiceKeys) {
    const option = input[key];
    if (typeof option !== 'string' || !Object.hasOwn(documentChoices[key].options, option)) throw new Error(`Choose an available option for ${documentChoices[key].label.toLowerCase()}`);
    spec[key] = option;
  }
  return spec;
}

export function documentPrintSummary(value: DocumentPrintSpec) {
  const spec = parseDocumentPrint(value);
  // Each copy begins on its own sheet; odd duplex pages never share across copies.
  const sheets = Math.ceil(spec.pages / (spec.sides === 'double' ? 2 : 1)) * spec.copies;
  return {
    sheets,
    printedPages: spec.pages * spec.copies,
    rows: [
      ['Pages per copy', String(spec.pages)], ['Copies', String(spec.copies)],
      ...choiceKeys.map(key => [documentChoices[key].label, (documentChoices[key].options as Record<string, string>)[spec[key]]]),
    ],
  };
}

export function documentDraftText(spec: DocumentPrintSpec): string {
  const summary = documentPrintSummary(spec);
  return [
    'VIRTUAL INK — LOCAL DOCUMENT PRINT SPECIFICATION',
    'NOT SUBMITTED. This is not an order, receipt or confirmed quotation.', '',
    ...summary.rows.map(([label, value]) => `${label}: ${value}`),
    `Printed pages (all copies): ${summary.printedPages}`,
    `Estimated paper sheets (excluding covers): ${summary.sheets}`, '',
    'Price: Quotation required. No payable amount has been calculated.',
    'Paper stock, binding capacity, turnaround and delivery need vendor confirmation.',
    'Document upload, security scanning, vendor assignment and payment are not connected.',
    'Your document is not included in this specification.',
  ].join('\n');
}
