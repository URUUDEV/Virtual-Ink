import Link from 'next/link';
import type { ReactNode } from 'react';
export function ButtonLink({ href, children, secondary = false }: {
  href: string; children: ReactNode; secondary?: boolean;
}) {
  return <Link href={href} className={`button ${secondary ? 'button-secondary' : 'button-primary'}`}>{children}</Link>;
}
