import type { Metadata } from 'next';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Analytics } from '@vercel/analytics/next';
export const metadata: Metadata = {
  title: { default: 'Virtual Ink — Your Ideas. Our Print. Delivered.', template: '%s | Virtual Ink' },
  description: 'Printing, design and custom merchandise. Virtual Ink foundation preview by Shadow Root Security Technologies.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="preview-banner">{process.env.APPLICATION_ENVIRONMENT==='staging'
      ? 'Virtual Ink Acceptance Environment - No Real Orders or Payments.'
      : 'Visual preview · Illustrative products and prices. Orders, payments and vendor accounts are not live.'}</div>
    <SiteHeader />
    <main id="main">{children}</main>
    <SiteFooter />
    {process.env.APPLICATION_ENVIRONMENT!=='staging'&&<Analytics />}
  </body></html>;
}
