'use client';
import { useState } from 'react';
export function HealthStatus() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  async function check() {
    setState('loading');
    try {
      const response = await fetch('/api/v1/health', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      const body = await response.json();
      setState(response.ok && body.data?.service === 'Virtual Ink' && body.data?.status === 'ok' ? 'ok' : 'error');
    } catch { setState('error'); }
  }
  return <div className="health-status">
    <button className="button button-plain" type="button" disabled={state === 'loading'} onClick={check}>
      {state === 'loading' ? 'Checking…' : 'Check backend status'}
    </button>
    <p role="status" aria-live="polite">{state === 'ok' ? 'HTTP service responds. Database and storage readiness are not checked.' :
      state === 'error' ? 'Could not reach the health endpoint. You can retry.' : 'Checks the actual local health endpoint.'}</p>
  </div>;
}
