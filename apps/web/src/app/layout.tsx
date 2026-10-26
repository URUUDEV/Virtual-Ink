import type { Metadata } from 'next';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './globals.css';
import './home-upgrade.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
export const metadata: Metadata = {
  title: { default: 'Virtual Ink — Your Ideas. Our Print. Delivered.', template: '%s | Virtual Ink' },
  description: 'Printing, design and custom merchandise. Virtual Ink foundation preview by Shadow Root Security Technologies.',
  robots: { index: false, follow: false },
  icons: { icon:'/brand/vi-icon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="preview-banner">{process.env.APPLICATION_ENVIRONMENT==='ui_test'
      ? 'UI test site · Login, server uploads, orders and payments are disabled.'
      : process.env.APPLICATION_ENVIRONMENT==='staging'
      ? 'Virtual Ink Acceptance Environment - No Real Orders or Payments.'
      : 'Visual preview · Illustrative products and prices. Orders, payments and vendor accounts are not live.'}</div>
    <SiteHeader />
    <main id="main">{children}</main>
    <SiteFooter />
    {!['staging','ui_test'].includes(process.env.APPLICATION_ENVIRONMENT??'')&&<><Analytics /><SpeedInsights /></>}
  </body></html>;
}
