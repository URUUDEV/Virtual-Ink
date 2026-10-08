import 'server-only';
import { loadAccessDependencies } from '@backend/identity/runtime.ts';

// Reuse one server pool, never a browser pool. Rejected startup stays rejected.
let dependencies: ReturnType<typeof loadAccessDependencies> | undefined;
export function backendAccess() {
  return dependencies ??= loadAccessDependencies();
}
