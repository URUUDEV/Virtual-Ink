/** Browser-only design contract. No price, order, tenant or upload authority. */
export const draftKey = 'virtual-ink:tshirt-draft:v1';
import { dimensions, inspectArtwork } from '../../../../src/shared/artwork-inspection.ts';
export { inspectArtwork, maxArtworkBytes, maxArtworkDimension } from '../../../../src/shared/artwork-inspection.ts';
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
export function validateDesign(value: unknown): Design {
  const fail = () => { throw new Error('This saved draft is invalid or belongs to a different editor version.'); };
  if (!object(value) || !exactKeys(value, designKeys)) return fail();
  if (value.version !== 1 || value.product !== 'cotton-t-shirt' || typeof value.text !== 'string' ||
    // eslint-disable-next-line no-control-regex -- This security filter intentionally rejects ASCII control characters.
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
