/** Browser-only design contract. No price, order, tenant or upload authority. */
export const draftKey = 'virtual-ink:tshirt-draft:v1';
export const maxArtworkBytes = 2 * 1024 * 1024;
export const maxArtworkDimension = 4096;
import { fonts, type DesignFont } from './design-fonts.ts';
export { fonts } from './design-fonts.ts';
export const shirtColours = { white: '#ffffff', charcoal: '#252a33', navy: '#263b57' } as const;
export type Artwork = Readonly<{ data: string; width: number; height: number }>;
export type Design = Readonly<{
  version: 1; product: 'cotton-t-shirt'; text: string; colour: string;
  font: DesignFont; shirt: keyof typeof shirtColours;
  textX: number; textY: number; textSize: number; rotation: number;
  artX: number; artY: number; artSize: number; artwork: Artwork | null;
}>;
export const initialDesign: Design = Object.freeze({ version: 1, product: 'cotton-t-shirt',
  text: 'YOUR\nIDEA.', colour: '#263b57', font: 'Poppins', shirt: 'white',
  textX: 50, textY: 44, textSize: 42, rotation: 0, artX: 50, artY: 65,
  artSize: 55, artwork: null });
const designKeys = Object.keys(initialDesign);
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function bounded(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
function dimensions(width: number, height: number, maximum = maxArtworkDimension) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
    width > maximum || height > maximum || width * height > 16_000_000) {
    throw new Error('Use artwork up to 4096 pixels per side and 16 megapixels.');
  }
  return { width, height };
}
function signature(bytes: Uint8Array, values: readonly number[], offset = 0) {
  return values.every((value, index) => bytes[offset + index] === value);
}
function ascii(bytes: Uint8Array, offset: number, count: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + count));
}
/** Check declared dimensions before invoking the browser image decoder. */
export function inspectArtwork(bytes: Uint8Array): { mime: string; width: number; height: number } {
  if (!bytes.length || bytes.length > maxArtworkBytes) throw new Error('Choose a PNG, JPEG or WebP image up to 2 MB.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (signature(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) {
    if (bytes.length < 33 || view.getUint32(8) !== 13 || ascii(bytes, 12, 4) !== 'IHDR') throw new Error('This PNG is incomplete.');
    const size = dimensions(view.getUint32(16), view.getUint32(20));
    let offset = 8;
    let ended = false;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      if (length > bytes.length - offset - 12) throw new Error('This PNG is incomplete.');
      const type = ascii(bytes, offset + 4, 4);
      if (type === 'acTL') throw new Error('Choose a still image; animated artwork is not supported.');
      offset += length + 12;
      if (type === 'IEND') { ended = true; break; }
    }
    if (!ended || offset !== bytes.length) throw new Error('This PNG is incomplete or has trailing data.');
    return { mime: 'image/png', ...size };
  }
  if (signature(bytes, [255, 216])) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || length > bytes.length - offset) break;
      if ([192, 193, 194].includes(marker)) {
        if (length < 8) break;
        return { mime: 'image/jpeg', ...dimensions(view.getUint16(offset + 5), view.getUint16(offset + 3)) };
      }
      offset += length;
    }
    throw new Error('This JPEG is incomplete or unsupported.');
  }
  if (bytes.length >= 20 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    if (view.getUint32(4, true) + 8 !== bytes.length) throw new Error('This WebP is incomplete.');
    let offset = 12;
    let size: { width: number; height: number } | undefined;
    function checkSize(width: number, height: number) {
      const candidate = dimensions(width, height);
      if (size && (size.width !== width || size.height !== height)) throw new Error('The WebP image dimensions do not match its canvas.');
      size = candidate;
    }
    while (offset + 8 <= bytes.length) {
      const type = ascii(bytes, offset, 4), length = view.getUint32(offset + 4, true), data = offset + 8;
      if (length > bytes.length - data) throw new Error('This WebP is incomplete.');
      if (type === 'ANIM' || type === 'ANMF') throw new Error('Choose a still image; animated artwork is not supported.');
      if (type === 'VP8X' && length >= 10) {
        if (bytes[data] & 2) throw new Error('Choose a still image; animated artwork is not supported.');
        const width = 1 + bytes[data + 4] + (bytes[data + 5] << 8) + (bytes[data + 6] << 16);
        const height = 1 + bytes[data + 7] + (bytes[data + 8] << 8) + (bytes[data + 9] << 16);
        checkSize(width, height);
      } else if (type === 'VP8 ' && length >= 10 && signature(bytes, [157, 1, 42], data + 3)) {
        checkSize(view.getUint16(data + 6, true) & 16383, view.getUint16(data + 8, true) & 16383);
      } else if (type === 'VP8L' && length >= 5 && bytes[data] === 47) {
        const bits = view.getUint32(data + 1, true);
        checkSize(1 + (bits & 16383), 1 + ((bits >>> 14) & 16383));
      }
      offset = data + length + (length % 2);
    }
    if (size && offset === bytes.length) return { mime: 'image/webp', ...size };
    throw new Error('This WebP is incomplete or unsupported.');
  }
  throw new Error('Choose a PNG, JPEG or WebP image. SVG and other files are not supported.');
}
export function validateDesign(value: unknown): Design {
  const fail = () => { throw new Error('This saved draft is invalid or belongs to a different editor version.'); };
  if (!object(value) || !exactKeys(value, designKeys)) return fail();
  if (value.version !== 1 || value.product !== 'cotton-t-shirt' || typeof value.text !== 'string' ||
    value.text.length > 72 || value.text.split('\n').length > 3 || /[\u0000-\u0009\u000b-\u001f\u007f]/.test(value.text) ||
    typeof value.colour !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.colour) ||
    typeof value.font !== 'string' || !fonts.includes(value.font as DesignFont) || typeof value.shirt !== 'string' || !Object.hasOwn(shirtColours, value.shirt)) return fail();
  for (const key of ['textX', 'textY', 'artX', 'artY']) if (!bounded(value[key], 0, 100)) return fail();
  if (!bounded(value.textSize, 16, 56) || !bounded(value.artSize, 10, 100) || !bounded(value.rotation, -180, 180)) return fail();
  if (value.artwork !== null) {
    const artwork = value.artwork;
    if (!object(artwork) || !exactKeys(artwork, ['data', 'width', 'height']) ||
      typeof artwork.data !== 'string' || artwork.data.length > 3_000_000 ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(artwork.data)) return fail();
    try {
      const binary = atob(artwork.data.slice('data:image/png;base64,'.length));
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const size = inspectArtwork(bytes);
      dimensions(size.width, size.height, 1024);
      if (size.mime !== 'image/png' || size.width !== artwork.width || size.height !== artwork.height) return fail();
    } catch { return fail(); }
  }
  return { ...value, artwork: value.artwork ? { ...value.artwork as Artwork } : null } as Design;
}
export function parseDraft(source: string): Design {
  if (source.length > 3_001_000) throw new Error('The saved draft is too large.');
  return validateDesign(JSON.parse(source));
}
export type History = Readonly<{ present: Design; past: readonly Design[]; future: readonly Design[]; start: Design | null }>;
export const initialHistory: History = { present: initialDesign, past: [], future: [], start: null };
export type DesignAction = { type: 'begin' | 'end' | 'undo' | 'redo' } | { type: 'change'; design: Design } | { type: 'artwork'; artwork: Artwork };
function equal(a: Design, b: Design) { return designKeys.every(key => a[key as keyof Design] === b[key as keyof Design]); }
function finish(state: History): History {
  if (!state.start) return state;
  return { ...state, start: null, past: equal(state.start, state.present) ? state.past : [...state.past, state.start].slice(-30),
    future: equal(state.start, state.present) ? state.future : [] };
}
export function designReducer(state: History, action: DesignAction): History {
  if (action.type === 'artwork') return designReducer(state, { type: 'change', design: { ...state.present, artwork: action.artwork } });
  if (action.type === 'begin') return state.start ? state : { ...state, start: state.present };
  if (action.type === 'end') return finish(state);
  if (action.type === 'change') {
    if (equal(state.present, action.design)) return state;
    return { ...state, present: action.design, past: state.start ? state.past : [...state.past, state.present].slice(-30), future: [] };
  }
  const settled = finish(state);
  if (action.type === 'undo') {
    const previous = settled.past.at(-1);
    return previous ? { present: previous, past: settled.past.slice(0, -1), future: [settled.present, ...settled.future], start: null } : settled;
  }
  const next = settled.future[0];
  return next ? { present: next, past: [...settled.past, settled.present].slice(-30), future: settled.future.slice(1), start: null } : settled;
}
