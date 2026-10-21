import { runtimeSecurityNotice } from '../src/backend/setup/environment-isolation.ts';
import { runtimeIsAllowed } from './security-runtime.ts';
const allowed = runtimeIsAllowed(process.versions.node) && !runtimeSecurityNotice.open;
console.log(JSON.stringify({ check: 'sensitive_runtime_release', status: allowed ? 'pass' : 'blocked',
  actual: process.versions.node, baseline: runtimeSecurityNotice.minimum,
  reason: allowed ? 'REVIEWED_SECURITY_FIX' : runtimeSecurityNotice.open ? 'PUBLISHED_HIGH_ADVISORY_AWAITING_REVIEWED_FIX' : 'RUNTIME_PATCH_REQUIRED',
  source: runtimeSecurityNotice.source }));
process.exitCode = allowed ? 0 : 1;
