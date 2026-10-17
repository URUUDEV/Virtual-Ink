/** Public blank-product metadata only. Never place customer files or signed URLs here. */
export type PreviewType = 'garment-3d' | 'vessel-3d' | 'flat-2d';
export type Method = 'screen-print' | 'dtg' | 'dtf' | 'sublimation' | 'embroidery' | 'vinyl' | 'heat-transfer' | 'pad-print' | 'uv-print' | 'laser';
export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type DecorationZone = Readonly<{
  id: string; name: string; surface: string; widthMm: number; heightMm: number;
  safeInsetMm: number; bleedMm: number; maxPrintMm: readonly [number, number];
  methods: readonly Method[]; minDpi: number; maxColours: number | null;
  orientation: 'upright'; restricted: readonly Rect[]; estimatedCostZmw: number | null;
}>;
export type ProductModel = Readonly<{
  id: string; vendorId: string | null; supplierReference: string | null; brand: string | null;
  name: string; sku: string; category: string; cut: 'unisex' | 'male' | 'female' | 'children' | null;
  construction: string; previewType: PreviewType; modelUrl: string | null;
  fallbackImages: readonly string[]; frontThumbnail: string; backThumbnail: string;
  materials: readonly string[]; fabricComposition: string | null; gsm: number | null;
  dimensionsMm: readonly [number, number, number]; capacityMl: number | null;
  sizes: readonly string[]; sizeChart: readonly { size: string; widthMm: number; heightMm: number }[];
  colours: readonly { name: string; hex: string }[]; printMethods: readonly Method[];
  zones: readonly DecorationZone[]; restrictedZones: readonly string[];
  uvMaps: readonly { surface: string; mapping: string }[];
  cameras: Readonly<{ front: readonly [number, number, number]; back: readonly [number, number, number] }>;
  lighting: Readonly<{ exposure: number; environment: 'studio-neutral' }>;
  modelVersion: string; assetLicence: Readonly<{ status: 'original-demo' | 'licensed'; reference: string }>;
  verification: 'draft' | 'pending_review' | 'verified'; lastVerificationDate: string | null;
  stockStatus: 'unknown' | 'in_stock' | 'out_of_stock'; leadTimeDays: number | null;
  priceZmw: number | null; supplyVerified: boolean; brandAuthorized: boolean;
  measurementsVerified: boolean; assetsVerified: boolean; demo: boolean;
}>;
const colours = [{ name: 'Chalk', hex: '#f5f2e9' }, { name: 'Ink', hex: '#293344' }, { name: 'Forest', hex: '#244c42' }, { name: 'Clay', hex: '#b66c54' }];
const garmentMethods: readonly Method[] = ['screen-print', 'dtg', 'dtf', 'embroidery', 'heat-transfer'];
function zone(id: string, name: string, surface: string, widthMm: number, heightMm: number, methods = garmentMethods): DecorationZone {
  return { id, name, surface, widthMm, heightMm, safeInsetMm: 5, bleedMm: 0,
    maxPrintMm: [widthMm - 10, heightMm - 10], methods, minDpi: 300, maxColours: null,
    orientation: 'upright', restricted: [], estimatedCostZmw: null };
}
function garment(id: string, name: string, construction: string, cut: ProductModel['cut'] = 'unisex'): ProductModel {
  const hoodie = construction === 'hoodie', corporate = construction === 'corporate';
  const front = zone('front', corporate ? 'Left chest' : 'Front', 'front', corporate ? 85 : 280, hoodie ? 220 : 360);
  return { id, name, construction, cut, vendorId: null, supplierReference: null, brand: null,
    sku: `DEMO-${id.toUpperCase()}`, category: 'apparel', previewType: 'garment-3d',
    modelUrl: `/models/studio-v1/${id}.glb`, fallbackImages: [`/models/studio-v1/${id}-front.svg`, `/models/studio-v1/${id}-back.svg`],
    frontThumbnail: `/models/studio-v1/${id}-front.svg`, backThumbnail: `/models/studio-v1/${id}-back.svg`,
    materials: ['Illustrative cotton fabric'], fabricComposition: null, gsm: null,
    dimensionsMm: cut === 'children' ? [380, 500, 160] : [560, 720, 200], capacityMl: null,
    sizes: ['Reference sample'], sizeChart: [], colours, printMethods: garmentMethods,
    zones: [front, zone('back', 'Back', 'back', 280, 360)],
    restrictedZones: ['collar', 'shoulder seams', 'side seams', 'sleeve seams', 'hem', ...(hoodie ? ['hood', 'pocket', 'drawstrings'] : []), ...(corporate || construction === 'polo' ? ['placket', 'buttons'] : [])],
    uvMaps: [{ surface: 'front', mapping: 'panel-xy-v1' }, { surface: 'back', mapping: 'panel-xy-v1' }],
    cameras: { front: [0, 0, 1], back: [0, 0, -1] }, lighting: { exposure: 1, environment: 'studio-neutral' },
    modelVersion: 'original-study-1', assetLicence: { status: 'original-demo', reference: 'docs/product-studio.md#original-assets' },
    verification: 'draft', lastVerificationDate: null, stockStatus: 'unknown', leadTimeDays: null,
    priceZmw: null, supplyVerified: false, brandAuthorized: false, measurementsVerified: false, assetsVerified: false, demo: true };
}
const mug: ProductModel = { ...garment('ceramic-mug', 'Ceramic mug · geometry study', 'mug', null), category: 'drinkware',
  previewType: 'vessel-3d', materials: ['Glazed ceramic'], fabricComposition: null, dimensionsMm: [120, 95, 82], capacityMl: 330,
  printMethods: ['sublimation', 'pad-print'], zones: [zone('wrap', 'Mug wrap', 'wrap', 200, 70, ['sublimation'])],
  restrictedZones: ['handle', 'handle clearance', 'rim', 'inner surface', 'base'], uvMaps: [{ surface: 'wrap', mapping: 'cylindrical-300-degrees-v1' }] };
const card: ProductModel = { ...garment('business-card', 'Business card · size study', 'card', null), category: 'print',
  previewType: 'flat-2d', modelUrl: null, materials: ['Unspecified card stock'], dimensionsMm: [90, 50, .35],
  zones: ['front', 'back'].map(side => ({ ...zone(side, side === 'front' ? 'Front' : 'Back', side, 96, 56, ['uv-print']), safeInsetMm: 6, bleedMm: 3, maxPrintMm: [96, 56] as const })),
  printMethods: ['uv-print'], restrictedZones: ['3 mm trim margin'], uvMaps: [] };
/** Deliberately absent from the sellable catalogue until physical/vendor review. */
export const productModels: readonly ProductModel[] = [
  garment('crew-unisex', 'Unisex crew-neck T-shirt', 'crew-short'),
  garment('crew-male', 'Men’s crew-neck T-shirt', 'crew-short', 'male'),
  garment('crew-female', 'Women’s fitted crew-neck T-shirt', 'crew-short', 'female'),
  garment('crew-children', 'Children’s crew-neck T-shirt', 'crew-short', 'children'),
  garment('long-sleeve', 'Long-sleeve crew-neck T-shirt', 'crew-long'),
  garment('polo', 'Short-sleeve polo shirt', 'polo'),
  garment('hoodie', 'Pullover hoodie', 'hoodie'),
  garment('corporate-shirt', 'Long-sleeve corporate shirt', 'corporate', 'male'), mug, card,
];
export function getProductModel(id: string): ProductModel {
  const product = productModels.find(item => item.id === id);
  if (!product) throw new Error('Choose a registered product.');
  return product;
}
/** Publication gate: a listing is not proof of supply, rights or model accuracy. */
export function publicationIssues(product: ProductModel): string[] {
  const issues: string[] = [];
  if (product.demo || product.verification !== 'verified') issues.push('Catalogue review is incomplete.');
  if (!product.vendorId || !product.supplierReference || !product.supplyVerified) issues.push('Vendor supply is unverified.');
  if (product.brand && !product.brandAuthorized) issues.push('Brand display permission is missing.');
  if (!product.measurementsVerified || !product.assetsVerified || product.assetLicence.status !== 'licensed') issues.push('Model, measurements and asset rights need approval.');
  if (!product.lastVerificationDate || product.stockStatus !== 'in_stock' || product.priceZmw === null || product.leadTimeDays === null) issues.push('Current stock, ZMW pricing, lead time and verification date are required.');
  if (!product.frontThumbnail || !product.backThumbnail || product.fallbackImages.length < 2 || product.previewType !== 'flat-2d' && !product.modelUrl) issues.push('Product preview assets are incomplete.');
  return issues;
}
