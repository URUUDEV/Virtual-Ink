import Link from 'next/link';
export const metadata={title:'Delivery and collection'};
export default function Delivery(){return <section className="section container ui-information"><p className="eyebrow">THE LAST MILE MATTERS</p><h1>From finished work to your hands.</h1><p>Collection and delivery should be part of the order plan, with a clear handoff after production and quality checks.</p>
  <h2>Collection</h2><p>The selected vendor must confirm the collection location, opening hours and person authorized to collect. No collection address is published by this preview.</p>
  <h2>Delivery</h2><p>Coverage, fees, promised dates, tracking and responsibility for a delayed or damaged handoff need confirmation before checkout. There is no live courier connection or delivery estimate here.</p>
  <h2>Keep the handoff clear</h2><ol><li>Confirm the production-ready status and quality check.</li><li>Confirm collection or delivery details privately.</li><li>Track the handoff and record receipt through the order workflow when available.</li></ol>
  <div className="ui-notice">Order tracking, delivery scheduling and proof of receipt are not enabled yet. Do not send your address or private order files through public enquiries.</div><Link className="text-link" href="/support">Read the help guide →</Link>
</section>;}
