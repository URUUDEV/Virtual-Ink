import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { demoProducts, filterDemoProducts, findDemoProduct, productImage, formatDemoPrice } from '../apps/web/src/lib/demo-products.ts';

test('visual fixtures have six unique, bounded, local product paths', () => {
  assert.equal(demoProducts.length, 6);
  assert.equal(new Set(demoProducts.map(product => product.slug)).size, 6);
  for (const product of demoProducts) {
    assert.match(product.slug, /^[a-z0-9-]+$/);
    assert.ok(existsSync(new URL(`../apps/web/public${productImage(product)}`, import.meta.url)));
    assert.ok(product.price > 0 && Number.isSafeInteger(product.price));
  }
});
test('catalogue supports trimmed case-insensitive search and group filtering', () => {
  assert.equal(filterDemoProducts('  POLO  ', 'All')[0]?.slug, 'polo-shirt');
  assert.equal(filterDemoProducts('', 'Apparel').length, 3);
  assert.equal(filterDemoProducts('', 'Print').length, 2);
  assert.equal(filterDemoProducts('', 'Signage').length, 1);
  assert.deepEqual(filterDemoProducts('hoodie', 'Print'), []);
});
test('illustrative price sorting does not mutate the shared fixtures', () => {
  const original = demoProducts.map(product => product.slug);
  assert.equal(filterDemoProducts('', 'All', 'price-low')[0].slug, 'business-cards');
  assert.equal(filterDemoProducts('', 'All', 'price-high')[0].slug, 'roll-up-banner');
  assert.deepEqual(demoProducts.map(product => product.slug), original);
});
test('unknown, traversal and script-like slugs never resolve to a product', () => {
  for (const slug of ['missing', '../../.env', '<script>alert(1)</script>', 'constructor', '__proto__']) assert.equal(findDemoProduct(slug), undefined);
  assert.deepEqual(filterDemoProducts('<script>alert(1)</script>', 'All'), []);
  assert.deepEqual(filterDemoProducts('x'.repeat(100000), 'All'), []);
});
test('supplied HTML remains unchanged and extracted images are correctly named', () => {
  const manifest = JSON.parse(readFileSync(new URL('../apps/web/public/images/products/provenance.json', import.meta.url), 'utf8'));
  assert.equal(manifest.sourceSha256, 'feda32323943a7a6f7d7da922ac953b5680bcb9a809803302bab91982a5b958a');
  const source = readFileSync(new URL('../virtual ink html.html', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), manifest.sourceSha256);
  assert.deepEqual(manifest.images.map((image: { alt: string }) => image.alt), demoProducts.map(product => product.name));
  assert.ok(manifest.images.every((image: { webBytes: number }) => image.webBytes > 0 && image.webBytes < 300000));
});
test('currency display remains explicitly ZMW', () => {
  assert.equal(formatDemoPrice(120), 'ZMW 120');
});
