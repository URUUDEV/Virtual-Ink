import VILogoSVG from '@/components/brand/VILogoSVG';
export default function Loading() {
  return <section className="section container" role="status" aria-live="polite"><div className="brand-loading-mark" aria-hidden="true"><VILogoSVG size={64} showWordmark={false} showTagline={false}/></div><p>Loading Virtual Ink…</p>
    <div className="skeleton" aria-hidden="true" /></section>;
}
