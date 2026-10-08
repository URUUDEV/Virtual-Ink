'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="section container info-page"><h1 className="page-title">This page couldn’t load.</h1>
    <p className="page-description">Please retry. Private error details are not shown.</p><button className="button button-primary" onClick={reset}>Try again</button></section>;
}
