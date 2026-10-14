/** Opt-in production-preview smoke checks. Synthetic requests, loopback only. */
const origin = 'http://127.0.0.1:3001';
let passed = 0;
function check(condition, id) {
  if (!condition) throw new Error(`Preview check failed: ${id}`);
  passed += 1;
}
async function request(path, options = {}) {
  return fetch(new URL(path, origin), {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(10000),
  });
}
try {
  const pages = ['/', '/shop', '/design-services', '/business', '/how-it-works', '/roadmap', '/customize/cotton-t-shirt', '/vendors/join',
    ...['cotton-t-shirt', 'polo-shirt', 'hoodie', 'business-cards', 'flyers-a5', 'roll-up-banner'].map(slug => `/shop/${slug}`)];
  for (const path of pages) {
    const response = await request(path);
    const html = await response.text();
    check(response.status === 200 && response.headers.get('content-type')?.includes('text/html'), `page:${path}`);
    check(response.headers.get('x-frame-options') === 'DENY' &&
      response.headers.get('x-content-type-options') === 'nosniff' &&
      response.headers.get('referrer-policy') === 'no-referrer' &&
      !response.headers.has('x-powered-by'), `headers:${path}`);
    check(html.includes('Illustrative') || html.includes('illustrative'), `demo-label:${path}`);
  }
  check((await request('/shop/unknown-synthetic-product')).status === 404, 'unknown-product');
  check((await request('/customize/unknown-synthetic-product')).status === 404, 'unknown-workspace');
  const queryResponse = await request('/shop?group=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  const queryHtml = await queryResponse.text();
  check(queryResponse.status === 200 && queryHtml.replace(/<[^>]*>/g, '').includes('6 product concepts') &&
    !queryHtml.includes('<script>alert(1)</script>'), 'untrusted-group');
  for (const path of ['/api/v1/me', '/api/v1/memberships', '/api/v1/tenants/11111111-1111-4111-8111-111111111111/access']) {
    const response = await request(path);
    const body = await response.json();
    check(response.status === 401 && body.error?.code === 'UNAUTHENTICATED' && !body.data &&
      response.headers.get('cache-control') === 'no-store', `guest-denial:${path}`);
  }
  check((await request('/api/v1/memberships', { method: 'POST' })).status === 405, 'membership-write-denial');
  check((await request('/api/synthetic-unknown')).status === 404, 'unknown-api');
  check((await request('/api/v1/vendor-applications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role: 'VendorOwner', approved: true }) })).status === 404, 'vendor-submission-disabled');
  const imagePath = '/_next/image?url=%2Fimages%2Fproducts%2Fcotton-t-shirt.webp&w=640&q=75';
  const image = await request(imagePath, { headers: { accept: 'image/webp' } });
  check(image.status === 200 && image.headers.get('content-type')?.startsWith('image/'), 'optimized-supplied-image');
  check((await request('/_next/image?url=https%3A%2F%2Fexample.invalid%2Fsynthetic.png&w=640&q=75')).status === 400, 'external-image-denial');
  console.log(JSON.stringify({ service: 'Virtual Ink', check: 'web_loopback_http', status: 'pass', passed }));
} catch {
  console.error(JSON.stringify({ service: 'Virtual Ink', check: 'web_loopback_http', status: 'fail', passed }));
  process.exitCode = 1;
}
