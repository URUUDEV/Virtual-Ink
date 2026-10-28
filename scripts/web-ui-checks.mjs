/** Source-level React SSR checks. Not a substitute for Next HTTP/browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
const webRoot = fileURLToPath(new URL('../apps/web/', import.meta.url));
const webRequire = createRequire(resolve(webRoot, 'package.json'));
const ts = webRequire('typescript');
const React = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path).exports;
  const source = readFileSync(path, 'utf8');
  const module = { exports: {} };
  modules.set(path, module);
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  function localRequire(specifier) {
    if (specifier.endsWith('.css')) return {};
    // Isolate the root-layout warning from navigation/router and static-image
    // imports. This check is not navigation, asset or browser acceptance.
    if (path.endsWith('layout.tsx') && specifier === '@/components/site-header') return {SiteHeader:()=>null};
    if (path.endsWith('layout.tsx') && specifier === '@/components/site-footer') return {SiteFooter:()=>null};
    if (specifier.startsWith('@/') || specifier.startsWith('@shared/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@shared/') ? resolve(webRoot, '../../src/shared', specifier.slice(8)) : specifier.startsWith('@/') ? resolve(webRoot, 'src', specifier.slice(2)) : resolve(dirname(path), specifier);
      if (base.endsWith('.ts') || base.endsWith('.tsx')) return load(base);
      try { return load(`${base}.tsx`); } catch (error) { if (error.code !== 'ENOENT') throw error; return load(`${base}.ts`); }
    }
    return webRequire(specifier);
  }
  // Execute only reviewed repository TypeScript; never the supplied HTML/scripts.
  const run = vm.runInThisContext(`(function(require,module,exports){${result.outputText}\n})`, { filename: path });
  run(localRequire, module, module.exports);
  return module.exports;
}
const component = (path, name = 'default') => load(resolve(webRoot, 'src', path))[name];

test('acceptance layout labels every rendered page with the no-real-orders warning',()=>{
  const previous=process.env.APPLICATION_ENVIRONMENT;process.env.APPLICATION_ENVIRONMENT='staging';
  try {
    const Layout=component('app/layout.tsx');
    const html=renderToStaticMarkup(React.createElement(Layout,{children:React.createElement('p',null,'Synthetic acceptance content')}));
    assert.match(html,/Virtual Ink Acceptance Environment - No Real Orders or Payments\./);
    assert.match(html,/Synthetic acceptance content/);
  }finally{previous===undefined?delete process.env.APPLICATION_ENVIRONMENT:process.env.APPLICATION_ENVIRONMENT=previous;}
});

test('UI-only test layout discloses disabled services and omits analytics',()=>{
  const previous=process.env.APPLICATION_ENVIRONMENT;process.env.APPLICATION_ENVIRONMENT='ui_test';
  try {
    const html=renderToStaticMarkup(React.createElement(component('app/layout.tsx'),{children:React.createElement('p',null,'Synthetic UI review')}));
    assert.match(html,/UI test site · Login, server uploads, orders and payments are disabled/);
    assert.doesNotMatch(html,/<script|_vercel\/insights/);
  }finally{previous===undefined?delete process.env.APPLICATION_ENVIRONMENT:process.env.APPLICATION_ENVIRONMENT=previous;}
});

test('restricted admin interface presents TOTP and explicit role review without default super-admin access',()=>{
  const Panel=component('components/security-admin-panel.tsx','SecurityAdminPanel');
  const initial={userId:'11111111-1111-4111-8111-111111111111',role:'SUPER_ADMIN',canManageRoles:true};
  const html=renderToStaticMarkup(React.createElement(Panel,{initial}));
  assert.match(html,/Authenticator security/);assert.match(html,/Six-digit authenticator code/);
  assert.match(html,/different super administrator/);assert.match(html,/Load current role/);
  assert.doesNotMatch(html,/<option[^>]+value="SUPER_ADMIN"[^>]+selected/);
  assert.doesNotMatch(html,/otpauth:|sb_secret_|access_token|refresh_token|mfaEnabled/);
  const lower=renderToStaticMarkup(React.createElement(Panel,{initial:{...initial,role:'ADMIN',canManageRoles:false}}));
  assert.doesNotMatch(lower,/Privileged role management/);assert.match(lower,/Authenticator security/);
  const protectedAccount=renderToStaticMarkup(React.createElement(Panel,{initial:{...initial,needsStepUp:true,
    factors:[{id:'33333333-3333-4333-8333-333333333333',type:'totp',status:'verified'}]}}));
  assert.match(protectedAccount,/Replace authenticator/);assert.match(protectedAccount,/Keep your existing authenticator until the replacement is verified/);
  assert.doesNotMatch(protectedAccount,/>Enroll authenticator</);
  assert.match(protectedAccount,/<button[^>]*disabled=""[^>]*>Remove selected factor/);
});
test('homepage renders actual mockups and linked product cards', () => {
  const html = renderToStaticMarkup(React.createElement(component('app/page.tsx')));
  assert.match(html, /Your Ideas/);
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /Illustrative/);
  for (const slug of ['cotton-t-shirt', 'polo-shirt', 'hoodie', 'business-cards', 'flyers-a5', 'roll-up-banner']) assert.ok(html.includes(`href="/shop/${slug}"`));
  assert.doesNotMatch(html, /Showcase%20Board|<script/);
  assert.match(html, /href="\/print-documents"/);
});

test('document printing exposes accessible options and explicitly closes unavailable uploads and checkout', () => {
  const html = renderToStaticMarkup(React.createElement(component('app/print-documents/page.tsx')));
  assert.match(html, /Ordering is not live yet/);
  assert.match(html, /Quotation required/);
  assert.match(html, /<form(?=[^>]*method="post")(?=[^>]*action="\/print-documents")[^>]*>/);
  assert.match(html, /<label for="print-pages">Pages per copy/);
  assert.match(html, /<label for="print-copies">Number of copies/);
  assert.match(html, /aria-describedby="print-pages-help"/);
  for (const name of ['purpose', 'paperSize', 'paperType', 'colour', 'sides', 'binding', 'urgency', 'handoff']) assert.ok(html.includes(`name="${name}"`));
  assert.match(html, /type="submit"[^>]*disabled=""/); // No native POST before hydration.
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /type="file"|href="\/checkout|name="price"|name="amount"|name="role"|Order confirmed/);
});
test('shop server page applies known groups and rejects untrusted query values', async () => {
  const Shop = component('app/shop/page.tsx');
  const html = renderToStaticMarkup(await Shop({ searchParams: Promise.resolve({ group: 'Signage' }) }));
  assert.match(html, /1 product concept/);
  assert.ok(html.includes('href="/shop/roll-up-banner"'));
  assert.ok(!html.includes('href="/shop/hoodie"'));
  const invalid = renderToStaticMarkup(await Shop({ searchParams: Promise.resolve({ group: '<script>alert(1)</script>' }) }));
  assert.match(invalid, /6 product concepts/);
  assert.doesNotMatch(invalid, /<script/);
});
test('all six detail pages render bounded fixture data and closed commercial actions', async () => {
  const Detail = component('app/shop/[slug]/page.tsx');
  for (const slug of ['cotton-t-shirt', 'polo-shirt', 'hoodie', 'business-cards', 'flyers-a5', 'roll-up-banner']) {
    const html = renderToStaticMarkup(await Detail({ params: Promise.resolve({ slug }) }));
    assert.match(html, /Illustrative price/);
    assert.match(html, /Orders, uploads and payments are not enabled/);
    assert.doesNotMatch(html, /href="\/(checkout|cart|admin|vendor)|<input[^>]+type="file"/);
    assert.match(html, /href="\/shop"/);
  }
});
test('invalid product slug invokes Next not-found boundary', async () => {
  await assert.rejects(component('app/shop/[slug]/page.tsx')({ params: Promise.resolve({ slug: '../../.env' }) }), error => error.digest === 'NEXT_HTTP_ERROR_FALLBACK;404');
});
test('showcase includes accessible manual controls with no automatic image rotation', () => {
  const html = renderToStaticMarkup(React.createElement(component('components/product-showcase.tsx', 'ProductShowcase')));
  assert.match(html, /aria-label="Previous product"/);
  assert.match(html, /aria-label="Next product"/);
  assert.match(html, /aria-live="polite"/);
  assert.equal((html.match(/aria-pressed=/g) ?? []).length, 6);
});

test('local T-shirt workspace exposes labelled controls and an explicit device-saving boundary', () => {
  const html = renderToStaticMarkup(React.createElement(component('app/customize/cotton-t-shirt/page.tsx')));
  assert.match(html, /Make it yours/);
  assert.match(html, /aria-label="Design controls"/);
  assert.match(html, /aria-label="Placement and draft controls"/);
  assert.match(html, /aria-label="Undo design change"/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(html, /Save on this device/);
  assert.match(html, /remove the saved draft when finished/);
  assert.doesNotMatch(html, /<form|action="|<script|href="\/(checkout|cart)/);
  assert.match(html, /3D shirt/);
  assert.match(html, /Download editable design/);
  assert.match(html, /Open a design file/);
  assert.match(html, /Undo restores your previous work/);
  for (const font of ['Space Grotesk', 'Bebas Neue', 'Playfair Display', 'Caveat']) assert.ok(html.includes(font));
});

test('3D preview exposes a separate current-view download while the renderer initializes', () => {
  const html = renderToStaticMarkup(React.createElement(component('components/tshirt-three-preview.tsx', 'TshirtThreePreview'), { design: load(resolve(webRoot,'src/lib/design-workspace.ts')).initialDesign, onFallback: () => {} }));
  assert.match(html, /Download 3D view/); assert.match(html, /Both are concept references/);
  assert.match(html, /Preparing your 3D shirt/);
});

test('procedural shirt keeps mesh resources bounded and maps front artwork within texture coordinates', () => {
  const { createShirtSurfaces } = load(resolve(webRoot, 'src/lib/shirt-3d.ts'));
  const surfaces = createShirtSurfaces();
  try {
    for (const surface of Object.values(surfaces)) {
      const position = surface.getAttribute('position');
      assert.ok(position.count > 0 && position.count < 100_000);
      assert.equal(position.count % 3, 0);
      assert.ok(Array.from(position.array).every(Number.isFinite));
    }
    const uv = surfaces.front.getAttribute('uv');
    assert.ok(Array.from(uv.array).every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    const front = surfaces.front.getAttribute('position'), back = surfaces.back.getAttribute('position');
    assert.equal(front.count, back.count);
    for (let i = 0; i < front.count; i++) { assert.ok(front.getZ(i) > 0); assert.ok(back.getZ(i) < 0); }
  } finally { Object.values(surfaces).forEach(surface => surface.dispose()); }
});

test('vendor preparation exposes a private local draft boundary and no submission or authority fields', () => {
  const html = renderToStaticMarkup(React.createElement(component('app/vendors/join/page.tsx')));
  assert.match(html, /Your vendor setup/); assert.match(html, /Step 1 of 4/);
  for (const label of ['Business or trading name', 'Contact name', 'Contact email', 'City or service area', 'Individual vendor', 'School-serving status']) assert.ok(html.includes(label));
  assert.match(html, /Details stay in this tab/); assert.match(html, /Online submission, verification and account activation are awaiting setup/);
  assert.doesNotMatch(html, /type="password"|name="(role|tenantId|approved)"/);
  assert.match(html, /<form(?=[^>]*method="post")(?=[^>]*action="\/vendors\/join")[^>]*>/);
  assert.match(html, /type="submit"[^>]*disabled=""/); // Local-only flow cannot POST before hydration.
  assert.match(html, /<noscript>/); assert.match(html, /href="\/vendor\/setup"/);
  assert.match(html, /autoComplete="organization"/i); assert.match(html, /aria-describedby="vendor-vendorKind-help"/);
  assert.match(html, /Save vendor draft on this device/); assert.match(html, /Download vendor draft/);
  assert.match(html, /Nothing is saved automatically or sent to a server/);
  assert.match(html, /accept="application\/json,.json"/);
});
