import VILogoSVG from './brand/VILogoSVG';
export function BrandLogo({ large = false }: { large?: boolean }) {
  if(large)return <VILogoSVG className="brand-logo-large" size={540}/>;
  return <span className="brand-logo"><VILogoSVG size={60} showWordmark={false}/><span className="brand-lockup-text" aria-hidden="true">VIRTUAL <strong>INK</strong><small>DESIGN · PRINT · ORDER · DELIVER</small></span></span>;
}
