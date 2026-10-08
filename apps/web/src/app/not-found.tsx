import { ButtonLink } from '@/components/ui/button-link';
export default function NotFound() {
  return <section className="section container info-page"><p className="eyebrow">PAGE NOT AVAILABLE</p><h1 className="page-title">That page isn’t here yet.</h1>
    <p className="page-description">Use the build roadmap to see what’s planned.</p><ButtonLink href="/">Return home</ButtonLink></section>;
}
