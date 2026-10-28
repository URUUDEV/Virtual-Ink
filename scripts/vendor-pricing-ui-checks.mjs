// Synthetic server-component/action checks; not genuine Auth or browser acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
const root = resolve('.'), web = resolve('apps/web/src'), require = createRequire(resolve('apps/web/package.json'));
const ts = require('typescript'), React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
function loader(overrides) {
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} }; cache.set(path, module);
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    function local(name) {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === 'server-only' || name.endsWith('.css')) return {};
      if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
      let target = name.startsWith('@/') ? resolve(web, name.slice(2)) : name.startsWith('@backend/') ? resolve(root, 'src/backend', name.slice(9)) : name.startsWith('.') ? resolve(dirname(path), name) : null;
      if (!target) return require(name);
      if (!/\.tsx?$/.test(target)) target += existsSync(`${target}.tsx`) ? '.tsx' : '.ts';
      return load(target);
    }
    vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename: path })(local, module, module.exports);
    return module.exports;
  }
  return load;
}
const id = '12345678-1234-4123-8123-123456789abc';
const dataset = { vendors: [{ id, name: 'Synthetic vendor' }], vendorId: id, prices: [], accepted: false, accruedCommissionMinor: 500,
  policy: { id, version: 1, basisPoints: 500, terms: 'Synthetic agreement <script>untrusted</script>', termsSha256: 'a'.repeat(64), collection: 'direct_to_vendor', settlement: 'weekly' } };
async function render(data = dataset, unavailable = false) {
  const load = loader({ '@/lib/order-dashboard': { async orderDashboardSession() { if (unavailable) throw Error('synthetic private database detail'); return { identity: {}, commerce: { async run() { return data; } } }; } }, '@/lib/vendor-commerce-actions': { vendorCommerceAction: async () => {} } });
  return renderToStaticMarkup(await load(resolve(web, 'components/vendor-pricing.tsx')).VendorPricing({ searchParams: Promise.resolve({ vendorId: id }) }));
}
test('vendor agreement displays stored terms/rate, escapes text and requires explicit native consent', async () => {
  const html = await render();
  assert.match(html, /5% of completed service work/); assert.match(html, /Customers pay you directly/);
  assert.match(html, /&lt;script&gt;untrusted&lt;\/script&gt;/); assert.doesNotMatch(html, /<script>untrusted/);
  assert.match(html, /name="termsSha256"/); assert.match(html, /<input(?=[^>]*type="checkbox")(?=[^>]*name="consent")(?=[^>]*required="")[^>]*>/);
  assert.doesNotMatch(html, /name="amount"|name="commissionBasisPoints"/);
  assert.match(html, /has not been recorded here/);
});
test('accepted vendors get labelled decimal-price forms; missing configuration never invents a fee or agreement', async () => {
  const html = await render({ ...dataset, accepted: true });
  assert.match(html, /label for="new-price-amount"/); assert.match(html, /inputMode="decimal"/i);
  assert.match(html, /Save a new price version|Add service price/); assert.doesNotMatch(html, /Accept this agreement|name="amountMinor"/);
  assert.match(html, /<fieldset>/); assert.match(html, /name="service" value="printing"/);
  const missing = await render({ ...dataset, policy: null });
  assert.match(missing, /No approved commission agreement/); assert.doesNotMatch(missing, /name="consent"|name="amount"/);
  const failed = await render(dataset, true);
  assert.match(failed, /could be loaded/); assert.doesNotMatch(failed, /private database|Synthetic vendor|5%/);
});
test('commercial server actions recheck session/origin and reject duplicate or forged financial fields', async () => {
  let calls = 0, origin = 'https://app.example.test';
  const load = loader({ 'next/headers': { headers: async () => new Headers({ origin }) }, 'next/navigation': { redirect: location => { throw Object.assign(Error('redirect'), { location }); } },
    './order-dashboard': { orderDashboardSession: async () => ({ identity: { subject: id }, origin: 'https://app.example.test', commerce: { async run(action, input, identity) { calls++; assert.equal(action, 'price.save'); assert.equal(input.amountMinor, 125); assert.equal(identity.subject, id); } } }) } });
  const { vendorCommerceAction } = load(resolve(web, 'lib/vendor-commerce-actions.ts'));
  const values = { action: 'price.save', vendorId: id, operationId: id, priceId: id, expectedVersion: '0', service: 'printing', label: 'Synthetic mono side', unit: 'page', amount: '1.25', currency: 'ZMW', '$ACTION_ID_synthetic': 'framework metadata' };
  const form = patch => { const data = new FormData(); for (const [key, value] of Object.entries({ ...values, ...patch })) data.append(key, value); return data; };
  const invoke = async data => { try { await vendorCommerceAction(data); assert.fail('redirect required'); } catch (error) { assert(error.location); return error.location; } };
  assert.match(await invoke(form()), /message=saved/); assert.equal(calls, 1);
  origin = 'https://attacker.invalid'; assert.match(await invoke(form()), /message=FORBIDDEN/); assert.equal(calls, 1);
  origin = 'https://app.example.test';
  assert.match(await invoke(form({ commissionBasisPoints: '0' })), /message=VALIDATION_FAILED/);
  assert.match(await invoke(form({ vendorId: 'https://attacker.invalid' })), /^\/vendor\/pricing\?/);
  const duplicate = form(); duplicate.append('amount', '0.01'); assert.match(await invoke(duplicate), /message=VALIDATION_FAILED/); assert.equal(calls, 1);
});
