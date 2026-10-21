// Official October security advisory verified 21 October 2026. This is a reviewed
// baseline for that advisory, not a substitute for checking new advisories.
export const minimumNode = '24.22.1';
export const runtimeSecurityNotice = Object.freeze({ open: false, minimum: minimumNode,
  source: 'https://nodejs.org/en/blog/vulnerability/october-2026-security-releases' });
export function runtimeIsAllowed(version: string): boolean {
  const match = /^24\.(\d+)\.(\d+)$/.exec(version);
  return Boolean(match && (Number(match[1]) > 22 || Number(match[1]) === 22 && Number(match[2]) >= 1));
}
export function sensitiveRuntimeApproved(version: string = process.versions.node): boolean {
  return runtimeIsAllowed(version) && !runtimeSecurityNotice.open;
}
