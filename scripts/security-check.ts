import { readFile, lstat, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Finding = Readonly<{ path: string; line: number; rule: string }>;
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql', '.yml', '.yaml', '.toml', '.txt', '.example']);

export function privatePath(path: string): boolean {
  const name = path.replaceAll('\\', '/');
  return /(^|\/)(\.private|node_modules|\.next)(\/|$)/.test(name) || /^(uploads|storage)(\/|$)/.test(name) ||
    /(^|\/)\.env(?:\..*)?$/.test(name) && !name.endsWith('/.env.example') && name !== '.env.example' ||
    /\.(?:key|p12|pfx)$/i.test(name);
}

// Heuristics only. Findings contain locations/rule IDs, never matching values.
// Full secret scanning, history scanning and release bundle inspection are separate gates.
export function inspectText(path: string, source: string): Finding[] {
  const findings: Finding[] = [];
  for (const match of source.matchAll(/-----BEGIN ((?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY)-----\s+[A-Za-z0-9+/=\s]{32,}-----END \1-----/g)) {
    findings.push({ path, line: source.slice(0, match.index).split(/\r?\n/).length, rule: 'PRIVATE_KEY' });
  }
  source.split(/\r?\n/).forEach((line, index) => {
    const add = (rule: string) => findings.push({ path, line: index + 1, rule });
    for (const match of line.matchAll(/sb_secret_[A-Za-z0-9_-]{20,}/g)) {
      if (!/synthetic|fixture|example|placeholder/i.test(match[0])) add('SUPABASE_SECRET');
    }
    for (const match of line.matchAll(/postgres(?:ql)?:\/\/[^\s'"`<>]+/g)) {
      try {
        const url = new URL(match[0]);
        const password = decodeURIComponent(url.password);
        const knownFixture = path === 'test/setup.test.ts' && match[0] === 'postgresql://' + 'private:private@localhost/test';
        if (password && !knownFixture && !/example|synthetic|placeholder|redacted|replace|change.?me|your|secret|demo|\$|\{|\}/i.test(password)) add('DATABASE_CREDENTIAL_REVIEW');
      } catch { /* Malformed text is not a recognized connection credential. */ }
    }
    for (const match of line.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,}/g)) {
      if (!/synthetic|fixture|example|placeholder/i.test(match[0])) add('JWT_REVIEW');
    }
  });
  return findings;
}

export async function checkRepository(root: string) {
  const candidates: string[] = [];
  async function walk(folder: string) {
    for (const entry of await readdir(resolve(root, folder), { withFileTypes: true })) {
      const path = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink() || privatePath(path) || ['.git', '.codex', '.agents', 'asssets', 'output', 'coverage', 'out'].includes(entry.name)) continue;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) candidates.push(path);
    }
  }
  await walk('');
  const findings: Finding[] = [];
  let scanned = 0;
  let skipped = 0;
  for (const path of candidates) {
    if (!textExtensions.has(extname(path)) && !['AGENTS.md', '.gitignore'].includes(path)) { skipped++; continue; }
    const absolute = resolve(root, path);
    const info = await lstat(absolute).catch(() => undefined);
    if (!info?.isFile() || info.size > 2 * 1024 * 1024) { skipped++; continue; }
    findings.push(...inspectText(path, await readFile(absolute, 'utf8')));
    scanned++;
  }
  return { service: 'Virtual Ink', check: 'repository_security_heuristics', status: findings.length ? 'review_required' : 'pass', scanned, skipped, findings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  checkRepository(root).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.findings.length ? 1 : 0;
  }).catch(() => {
    console.error(JSON.stringify({ service: 'Virtual Ink', check: 'repository_security_heuristics', status: 'blocked' }));
    process.exitCode = 1;
  });
}
