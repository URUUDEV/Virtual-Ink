import Image from 'next/image';
import approvedLogo from '../../../../asssets/Virtual Ink Gradient Logo.png';
export function BrandLogo({ large = false }: { large?: boolean }) {
  return <Image className={large ? 'brand-logo brand-logo-large' : 'brand-logo'}
    src={approvedLogo} alt="Virtual Ink — Design, Print, Order, Deliver"
    width={large ? 540 : 144} height={large ? 360 : 96} priority={large} />;
}
