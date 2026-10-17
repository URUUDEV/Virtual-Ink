import Link from 'next/link';
export const metadata={title:'About Virtual Ink'};
export default function About(){return <section className="section container ui-information"><p className="eyebrow">YOUR IDEAS. OUR PRINT. DELIVERED.</p><h1>A clearer path from idea to print.</h1><p>Virtual Ink is being built by Shadow Root Security Technologies to connect individual customers, students, organizations and businesses with printing, design and merchandise vendors.</p>
  <h2>Creative tools. Clear decisions.</h2><p>Product-specific previews help you explore an idea. Verified vendor specifications, an agreed quotation and an approved production proof must establish what gets made.</p>
  <h2>Trust is a workflow</h2><p>Our implementation requirements include private customer files, server-side authorization, MFA for privileged actions, audited changes and proof approval before production. These are release requirements; they do not establish that unfinished workflows are already live.</p>
  <h2>Current availability</h2><p>This is an early product preview. Discovery concepts and local design tools are available. Verified vendor listings, private uploads, live ordering, payments and delivery integrations are still being prepared.</p><Link className="button button-primary" href="/how-it-works">See the intended journey</Link>
</section>;}
