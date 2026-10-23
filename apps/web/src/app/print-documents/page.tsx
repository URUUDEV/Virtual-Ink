import type { Metadata } from 'next';
import { DocumentPrintForm } from '@/components/document-print-form';
import './print-documents.css';

export const metadata: Metadata = {
  title: 'Print documents, assignments and notes',
  description: 'Prepare a document print specification with paper, copies, colour and binding options. Ordering is not live yet.',
};

export default function PrintDocuments() {
  return <section className="section container document-print-page">
    <header className="document-print-intro"><p className="eyebrow">FOR STUDY, WORK AND EVERYDAY LIFE</p>
      <h1>Your documents.<br/>Ready for print.</h1>
      <p>Assignments, lecture notes, dissertations and office documents. Choose how you want them printed, then review every detail.</p>
    </header>
    <div className="ui-notice"><strong>Prepare your specification · Ordering is not live yet</strong>
      <p>You can configure, review and download your choices. Private uploads, vendor quotations and checkout are still being connected. Nothing is submitted and no payment is taken.</p></div>
    <DocumentPrintForm/>
    <section className="document-print-help" aria-labelledby="print-file-help"><h2 id="print-file-help">Have your document ready</h2>
      <p>Export Word or Google Docs files as a PDF to preserve fonts, page breaks and layout. Check the page count and remove pages you do not want printed before preparing your specification.</p>
      <p>Keep the PDF on your device for now. Secure private upload and malware screening must be connected before Virtual Ink can accept documents.</p>
    </section>
  </section>;
}
