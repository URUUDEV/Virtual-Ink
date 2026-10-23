'use client';

import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowRight, Download, FileText, Pencil } from 'lucide-react';
import { documentChoices, documentDraftText, documentPrintSummary, parseDocumentPrint, type DocumentChoice, type DocumentPrintSpec } from '@shared/document-print';

const subscribe = () => () => {};
const defaults: Record<DocumentChoice, string> = { purpose: 'assignment', paperSize: 'a4', paperType: 'standard', colour: 'mono', sides: 'single', binding: 'none', urgency: 'standard', handoff: 'collection' };

export function DocumentPrintForm() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const form = useRef<HTMLFormElement>(null);
  const review = useRef<HTMLHeadingElement>(null);
  const [spec, setSpec] = useState<DocumentPrintSpec | null>(null);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSpec(parseDocumentPrint(Object.fromEntries(new FormData(event.currentTarget))));
      setError(''); setDownloaded(false);
      // The review section stays mounted so focus does not depend on a timer.
      review.current?.focus();
    } catch (failure) {
      setSpec(null); setError(failure instanceof Error ? failure.message : 'Check your print options.');
    }
  }
  function download() {
    if (!spec) return;
    try {
      const url = URL.createObjectURL(new Blob([documentDraftText(spec)], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'virtual-ink-document-specification.txt';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloaded(true); setError('');
    } catch {
      setError('The download could not start. Your choices are still shown here; try again or copy the review details.');
    }
  }
  const summary = spec ? documentPrintSummary(spec) : null;
  return <div className="document-print-layout">
    <form ref={form} method="post" action="/print-documents" onSubmit={submit} onChange={() => { setSpec(null); setError(''); setDownloaded(false); }} className="document-print-form">
      <div className="print-section-heading"><span aria-hidden="true">01</span><div><h2>Choose your print options</h2><p>All options are required. Availability is confirmed with the vendor.</p></div></div>
      <fieldset className="print-counts"><legend>Pages and copies</legend>
        <div><label htmlFor="print-pages">Pages per copy (required)</label><input id="print-pages" name="pages" type="number" min="1" max="2000" step="1" inputMode="numeric" required defaultValue="1" aria-describedby="print-pages-help"/><p id="print-pages-help">Enter the number of pages in your PDF, from 1 to 2,000.</p></div>
        <div><label htmlFor="print-copies">Number of copies (required)</label><input id="print-copies" name="copies" type="number" min="1" max="1000" step="1" inputMode="numeric" required defaultValue="1" aria-describedby="print-copies-help"/><p id="print-copies-help">Each copy is one complete set of your pages. Maximum 1,000.</p></div>
      </fieldset>
      {(Object.keys(documentChoices) as DocumentChoice[]).map(key => <fieldset className="print-choice-group" key={key}><legend>{documentChoices[key].label}</legend>
        <div className="print-choices">{Object.entries(documentChoices[key].options).map(([value, title]) => <label key={value} className="print-choice" htmlFor={`print-${key}-${value}`}>
          <input id={`print-${key}-${value}`} type="radio" name={key} value={value} required defaultChecked={defaults[key] === value}/><span>{title}</span>
        </label>)}</div>
      </fieldset>)}
      <button type="submit" className="button button-primary" disabled={!ready}>Review print specification <ArrowRight size={18} aria-hidden="true"/></button>
      <noscript><p>This local preparation form needs JavaScript. No document has been uploaded or order submitted. Enable JavaScript to review your choices.</p></noscript>
    </form>
    <aside className="print-review" aria-labelledby="print-review-heading">
      <div className="print-section-heading"><span aria-hidden="true">02</span><h2 id="print-review-heading" ref={review} tabIndex={-1}>Your print specification</h2></div>
      {error && <p role="alert">{error}</p>}
      {summary ? <><p className="ui-status">Reviewed locally · Not submitted</p><dl className="print-summary">{summary.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <div className="print-sheet-count"><strong>{summary.printedPages.toLocaleString('en-GB')} printed pages</strong><p>Approximately {summary.sheets.toLocaleString('en-GB')} paper sheets across all copies, excluding covers. Each copy starts on a new sheet.</p></div>
        <div className="print-review-actions"><button type="button" className="button button-plain" onClick={() => form.current?.querySelector('input')?.focus()}><Pencil size={16} aria-hidden="true"/>Edit options</button>
          <button type="button" className="button button-primary" onClick={download}><Download size={16} aria-hidden="true"/>Download specification</button></div>
        <p role="status">{downloaded ? 'Specification download requested. Your document is not included; no order has been placed.' : 'Your reviewed choices stay on this page until you change them or leave.'}</p>
      </> : <div className="print-review-empty"><FileText size={38} aria-hidden="true"/><p>Choose your options and select “Review print specification” to see your document requirements here.</p></div>}
      <div className="print-quote"><h3>Quotation required</h3><p>Printing, binding, platform fees, tax and any delivery charges need approved server pricing. No payable total is available yet.</p></div>
      <div className="print-next"><h3>Next: private upload and vendor quote</h3><p>These steps are not available yet. Your document stays on your device. No vendor receives this specification, and no collection date is booked.</p></div>
    </aside>
  </div>;
}
