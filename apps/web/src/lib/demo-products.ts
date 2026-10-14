/** Visual fixtures from the supplied HTML. Never an authoritative pricing source. */
export const productGroups = ['All', 'Apparel', 'Print', 'Signage'] as const;
export type ProductGroup = typeof productGroups[number];
export const demoProducts = [
  { slug: 'cotton-t-shirt', name: 'Cotton T-Shirt', group: 'Apparel', finish: 'Custom print', price: 120, unit: 'per shirt', description: 'A simple canvas for your next idea. Explore a classic crew-neck shirt for teams, events and everyday expression.' },
  { slug: 'polo-shirt', name: 'Polo Shirt', group: 'Apparel', finish: 'Embroidery concept', price: 150, unit: 'per shirt', description: 'Give your team a considered, coordinated look with a polo shirt and a personal brand detail.' },
  { slug: 'hoodie', name: 'Hoodie', group: 'Apparel', finish: 'Custom print', price: 220, unit: 'per hoodie', description: 'Bring your identity to a comfortable layer. A merchandise concept for communities, teams and creative projects.' },
  { slug: 'business-cards', name: 'Business Cards', group: 'Print', finish: 'Standard · 500 pieces', price: 60, unit: 'per reference pack', description: 'Make your introduction memorable with a neatly finished business card. Explore a clean stationery concept.' },
  { slug: 'flyers-a5', name: 'Flyers A5', group: 'Print', finish: 'Full-colour concept', price: 90, unit: 'reference price; pack size unconfirmed', description: 'Put your message in someone’s hands. A full-colour flyer concept for launches, events and local announcements.' },
  { slug: 'roll-up-banner', name: 'Roll Up Banner', group: 'Signage', finish: 'Event display', price: 650, unit: 'per banner', description: 'Give your message a bigger presence. Explore a standing banner concept for events and business spaces.' },
] as const;
export type DemoProduct = typeof demoProducts[number];
export function productImage(product: DemoProduct) { return `/images/products/${product.slug}.webp`; }
export function formatDemoPrice(price: number) { return `ZMW ${price.toLocaleString('en-ZM')}`; }
export function findDemoProduct(slug: string) { return demoProducts.find(product => product.slug === slug); }
export function filterDemoProducts(query: string, group: ProductGroup, sort: 'featured' | 'price-low' | 'price-high' = 'featured') {
  const search = query.trim().toLowerCase().slice(0, 100);
  const results = demoProducts.filter(product => (group === 'All' || product.group === group) && `${product.name} ${product.group} ${product.finish}`.toLowerCase().includes(search));
  return sort === 'featured' ? results : [...results].sort((a, b) => sort === 'price-low' ? a.price - b.price : b.price - a.price);
}
