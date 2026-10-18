import { getProductModel, type DecorationZone, type Method, type Rect } from './product-models.ts';
import { inspectArtwork } from './artwork-inspection.ts';
export const previewNotice = 'Digital preview — final colour, placement and material appearance may vary. Production begins only after proof approval.';
export type StudioLayer = Readonly<{ id: string; zoneId: string; kind: 'text' | 'image'; text: string; font: 'Poppins' | 'Bebas Neue' | 'Caveat'; colour: string; x: number; y: number; width: number; height: number; rotation: number; image: string | null; pixelWidth: number; pixelHeight: number }>;
export type StudioDesign = Readonly<{ version: 1; productId: string; modelVersion: string; colour: string; size: string; quantity: number; method: Method; layers: readonly StudioLayer[]; notes: string }>;
export function newStudioDesign(productId: string): StudioDesign {
  const p = getProductModel(productId);
  return { version: 1, productId, modelVersion: p.modelVersion, colour: p.colours[0].hex, size: p.sizes[0], quantity: 1, method: p.printMethods[0], layers: [], notes: '' };
}
export function layerBounds(layer: StudioLayer): Rect {
  const radians = layer.rotation * Math.PI / 180, c = Math.abs(Math.cos(radians)), s = Math.abs(Math.sin(radians));
  const width = layer.width * c + layer.height * s, height = layer.width * s + layer.height * c;
  return { x: layer.x - width / 2, y: layer.y - height / 2, width, height };
}
function overlaps(a: Rect, b: Rect) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
/** sRGB screen estimate only; physical inks, fabric and underbases need vendor review. */
export function artworkContrast(foreground: string, background: string): number {
  function luminance(hex: string) {
    const rgb = [1, 3, 5].map(offset => {
      const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  }
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export function placementAllowed(layer: StudioLayer, zone: DecorationZone): boolean {
  const b = layerBounds(layer), inset = zone.safeInsetMm;
  return b.x >= inset - .000001 && b.y >= inset - .000001 && b.x + b.width <= zone.widthMm - inset + .000001 && b.y + b.height <= zone.heightMm - inset + .000001 &&
    layer.width <= zone.maxPrintMm[0] && layer.height <= zone.maxPrintMm[1] && !zone.restricted.some(rect => overlaps(b, rect));
}
/** Clamp the entire rotated box, not just its centre. Interior restricted areas reject. */
export function fitLayer(layer: StudioLayer, zone: DecorationZone): StudioLayer {
  const bounds = layerBounds(layer), scale = Math.min(1, (zone.widthMm - zone.safeInsetMm * 2) / bounds.width, (zone.heightMm - zone.safeInsetMm * 2) / bounds.height, zone.maxPrintMm[0] / layer.width, zone.maxPrintMm[1] / layer.height);
  const resized = { ...layer, width: layer.width * scale, height: layer.height * scale }, b = layerBounds(resized);
  const fitted = { ...resized, x: Math.max(zone.safeInsetMm + b.width / 2, Math.min(zone.widthMm - zone.safeInsetMm - b.width / 2, layer.x)), y: Math.max(zone.safeInsetMm + b.height / 2, Math.min(zone.heightMm - zone.safeInsetMm - b.height / 2, layer.y)) };
  if (!placementAllowed(fitted, zone)) throw new Error('Move the artwork clear of this restricted area.');
  return fitted;
}
export function artworkWarnings(design: StudioDesign): string[] {
  const p = getProductModel(design.productId), warnings: string[] = [];
  for (const layer of design.layers) {
    const zone = p.zones.find(z => z.id === layer.zoneId);
    if (!zone || !placementAllowed(layer, zone)) warnings.push(`${layer.id}: move artwork inside the safe area.`);
    if (zone && !zone.methods.includes(design.method)) warnings.push(`${layer.id}: select an allowed decoration method.`);
    if (layer.kind === 'image') {
      const dpi = Math.floor(Math.min(layer.pixelWidth / (layer.width / 25.4), layer.pixelHeight / (layer.height / 25.4)));
      if (zone && dpi < zone.minDpi) warnings.push(`${layer.id}: ${dpi} DPI at this size; use a larger original or reduce print size to reach ${zone.minDpi} DPI.`);
    } else if (layer.height / Math.max(1, layer.text.split('\n').length) < 3) warnings.push(`${layer.id}: text may be unreadable; increase its physical height.`);
    if (layer.kind === 'text') {
      const contrast = artworkContrast(layer.colour, design.colour);
      if (contrast < 3) warnings.push(`${layer.id}: low text contrast (screen estimate ${contrast.toFixed(2)}:1). Choose a lighter or darker text/product colour to reach the 3:1 preview guideline. Final ink contrast requires vendor review.`);
    }
  }
  if (design.method === 'embroidery') warnings.push('Stitch appearance is approximate. A vendor must digitise and approve the stitch file.');
  warnings.push('Colour mode, thin lines, transparency, effects, bleed and final legibility require vendor preflight. This preview is not a print-ready certification.');
  return warnings;
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function number(value: unknown, min: number, max: number) { return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max; }
function text(value: unknown, max: number): value is string { return typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b-\u001f\u007f]/u.test(value); } // eslint-disable-line no-control-regex -- Reject hidden controls in imported local drafts.
const colour = (value: unknown): value is string => typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value);
export function parseStudioDraft(source: string): StudioDesign {
  if (source.length > 6_000_000) throw new Error('Draft exceeds the 6 MB local limit.');
  const d: unknown = JSON.parse(source);
  if (!record(d) || Object.keys(d).sort().join() !== 'colour,layers,method,modelVersion,notes,productId,quantity,size,version' || d.version !== 1 || !text(d.productId, 80)) throw new Error('Unsupported design draft.');
  const p = getProductModel(d.productId);
  if (d.modelVersion !== p.modelVersion || !p.colours.some(c => c.hex === d.colour) || typeof d.size !== 'string' || !p.sizes.includes(d.size) || !number(d.quantity, 1, 1000) || !Number.isInteger(d.quantity) || !p.printMethods.includes(d.method as Method) || !text(d.notes, 1000) || !Array.isArray(d.layers) || d.layers.length > 12) throw new Error('Draft product options are invalid.');
  const ids = new Set<string>();
  for (const l of d.layers) {
    if (!record(l) || Object.keys(l).sort().join() !== 'colour,font,height,id,image,kind,pixelHeight,pixelWidth,rotation,text,width,x,y,zoneId' || !text(l.id, 80) || !/^[a-zA-Z0-9-]+$/.test(l.id) || ids.has(l.id) || !text(l.zoneId, 40) || typeof l.kind !== 'string' || !['text', 'image'].includes(l.kind) || !text(l.text, 160) || l.text.split('\n').length > 4 || typeof l.font !== 'string' || !['Poppins','Bebas Neue','Caveat'].includes(l.font) || !colour(l.colour) || !number(l.width, .1, 1000) || !number(l.height, .1, 1000) || !number(l.x, 0, 1000) || !number(l.y, 0, 1000) || !number(l.rotation, -180, 180) || !number(l.pixelWidth, 0, 4096) || !number(l.pixelHeight, 0, 4096)) throw new Error('Draft artwork is invalid.');
    ids.add(l.id);
    if (l.kind === 'text' ? l.image !== null : typeof l.image !== 'string' || l.image.length > 2_796_230 || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(l.image) || !number(l.pixelWidth, 1, 4096) || !number(l.pixelHeight, 1, 4096)) throw new Error('Draft contains unsupported artwork.');
    if (l.kind === 'image') {
      const bytes = Uint8Array.from(atob((l.image as string).slice(22)), c => c.charCodeAt(0)), image = inspectArtwork(bytes);
      if (image.mime !== 'image/png' || image.width !== l.pixelWidth || image.height !== l.pixelHeight || image.width > 1024 || image.height > 1024) throw new Error('Draft artwork dimensions do not match its PNG.');
    }
    const zone = p.zones.find(z => z.id === l.zoneId);
    if (!zone || !placementAllowed(l as StudioLayer, zone) || !zone.methods.includes(d.method as Method)) throw new Error('Draft artwork exceeds its allowed decoration area.');
  }
  return d as StudioDesign;
}
export type ProofRecord = Readonly<{ version: number; designSnapshot: string; status: 'awaiting_vendor' | 'awaiting_customer' | 'approved' | 'superseded'; approvedBy: string | null; approvedAt: string | null }>;
/** Changed configuration always starts a fresh, unapproved version. No authority to approve in the browser. */
export function reviseProof(previous: ProofRecord | null, design: StudioDesign): ProofRecord {
  const snapshot = JSON.stringify(parseStudioDraft(JSON.stringify(design)));
  if (previous?.designSnapshot === snapshot) return previous;
  return { version: (previous?.version ?? 0) + 1, designSnapshot: snapshot, status: 'awaiting_vendor', approvedBy: null, approvedAt: null };
}
