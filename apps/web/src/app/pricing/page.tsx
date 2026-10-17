import Link from 'next/link';
export const metadata={title:'Pricing explained'};
export default function Pricing(){return <section className="section container ui-information"><p className="eyebrow">CLEAR BEFORE YOU COMMIT</p><h1>Understand your print price.</h1><p>A final quotation needs a verified product, current vendor pricing and your exact production requirements. Catalogue concept prices are illustrative.</p>
  <h2>What goes into a quotation</h2><ul><li>Product or paper specification, size, colour and quantity.</li><li>Decoration method, artwork dimensions, placement and finishing.</li><li>Design assistance, binding and any approved urgency charge.</li><li>Collection or delivery, platform fee and applicable taxes, each shown separately.</li></ul>
  <div className="ui-notice"><strong>Live pricing and checkout are not connected.</strong><p>There is no authoritative order total in this preview. A browser estimate cannot authorize a price, payment or vendor payout.</p></div>
  <h2>Approval before production</h2><p>The intended journey separates accepting a quotation, authorizing payment and approving a vendor-issued proof. A visual studio reference is not production approval.</p><Link className="button button-primary" href="/studio">Explore the design studio</Link>
</section>;}
