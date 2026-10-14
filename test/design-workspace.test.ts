import test from 'node:test';
import assert from 'node:assert/strict';
import { designReducer, fonts, initialDesign, initialHistory, inspectArtwork, maxArtworkBytes, parseDraft, validateDesign } from '../apps/web/src/lib/design-workspace.ts';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQp8AAAAASUVORK5CYII=', 'base64');
const artwork = { data: `data:image/png;base64,${png.toString('base64')}`, width: 1, height: 1 };
const chunk = (name: string, data = Buffer.alloc(0)) => {
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length); result.write(name, 4, 'ascii'); data.copy(result, 8);
  return result; // Synthetic header fixtures; browser decoding is checked separately.
};
test('device drafts round-trip bounded text and normalized PNG, including literal markup', () => {
  const design = { ...initialDesign, text: '<script>local</script>', artwork };
  assert.deepEqual(parseDraft(JSON.stringify(design)), design);
  assert.deepEqual(parseDraft(JSON.stringify(initialDesign)), initialDesign);
});
test('bundled font choices survive draft restore and history; arbitrary fonts stay closed', () => {
  for (const font of fonts) {
    const design = { ...initialDesign, font };
    assert.equal(parseDraft(JSON.stringify(design)).font, font);
    const changed = designReducer(initialHistory, { type: 'change', design });
    assert.equal(designReducer(changed, { type: 'undo' }).present.font, 'Poppins');
  }
  for (const font of ['https://example.invalid/font.woff', '__proto__', ['Poppins'], { toString: () => 'Poppins' }]) {
    assert.throws(() => validateDesign({ ...initialDesign, font }));
  }
});
test('saved drafts reject forged authority, unsupported fields and invalid text or placement', () => {
  const invalid = [null, [], {}, { ...initialDesign, version: 2 }, { ...initialDesign, product: 'hoodie' },
    { ...initialDesign, price: 1 }, { ...initialDesign, text: 'x'.repeat(73) },
    { ...initialDesign, text: 'a\nb\nc\nd' }, { ...initialDesign, text: 'a\u0000b' },
    { ...initialDesign, colour: 'url(https://example.invalid)' }, { ...initialDesign, font: 'remote-font' },
    { ...initialDesign, shirt: '__proto__' }, { ...initialDesign, textX: NaN },
    { ...initialDesign, shirt: ['navy'] }, { ...initialDesign, shirt: { toString: () => 'white' } },
    { ...initialDesign, textY: Infinity }, { ...initialDesign, artX: -1 },
    { ...initialDesign, artY: 101 }, { ...initialDesign, textSize: 0 },
    { ...initialDesign, artSize: 101 }, { ...initialDesign, rotation: 181 }];
  for (const value of invalid) assert.throws(() => validateDesign(value));
  assert.throws(() => parseDraft('{'));
  assert.throws(() => parseDraft(' '.repeat(3_001_001)));
  assert.throws(() => parseDraft(JSON.stringify(initialDesign).replace('"version":1', '"version":1,"__proto__":{"polluted":true}')));
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
});
test('saved artwork rejects remote URLs, SVG, malformed data, mismatched dimensions and oversized images', () => {
  for (const value of [{ ...artwork, data: 'https://example.invalid/a.png' },
    { ...artwork, data: 'data:image/svg+xml;base64,PHN2Zy8+' },
    { ...artwork, data: 'data:image/png;base64,bm90LWFuLWltYWdl' },
    { ...artwork, data: 'data:image/png;base64,%%%%' }, { ...artwork, width: 2 },
    { ...artwork, extra: true }, { ...artwork, data: 'x'.repeat(3_000_001) }]) {
    assert.throws(() => validateDesign({ ...initialDesign, artwork: value }));
  }
  const large = Buffer.from(png); large.writeUInt32BE(1025, 16);
  assert.throws(() => validateDesign({ ...initialDesign, artwork: { data: `data:image/png;base64,${large.toString('base64')}`, width: 1025, height: 1 } }));
});
test('PNG admission rejects animation, truncation, trailing bytes and decode resource limits', () => {
  assert.deepEqual(inspectArtwork(png), { mime: 'image/png', width: 1, height: 1 });
  const animated = Buffer.concat([png.subarray(0, 33), chunk('acTL', Buffer.alloc(8)), png.subarray(33)]);
  for (const value of [Buffer.alloc(0), Buffer.alloc(maxArtworkBytes + 1), Buffer.from('<svg onload="alert(1)"/>'),
    Buffer.from('GIF89a'), png.subarray(0, 32), png.subarray(0, -1), Buffer.concat([png, Buffer.from('extra')]), animated]) {
    assert.throws(() => inspectArtwork(value));
  }
  for (const [width, height] of [[0, 1], [4097, 1], [4096, 4096]]) {
    const value = Buffer.from(png); value.writeUInt32BE(width, 16); value.writeUInt32BE(height, 20);
    assert.throws(() => inspectArtwork(value));
  }
});
test('JPEG and WebP headers bound dimensions and reject incomplete or animated input', () => {
  const jpeg = Buffer.from([255, 216, 255, 192, 0, 11, 8, 0, 20, 0, 30, 1, 1, 17, 0]);
  assert.deepEqual(inspectArtwork(jpeg), { mime: 'image/jpeg', width: 30, height: 20 });
  assert.throws(() => inspectArtwork(jpeg.subarray(0, -1)));
  const hugeJpeg = Buffer.from(jpeg); hugeJpeg.writeUInt16BE(5000, 9);
  assert.throws(() => inspectArtwork(hugeJpeg));
  const webp = Buffer.alloc(30); webp.write('RIFF'); webp.writeUInt32LE(22, 4); webp.write('WEBPVP8X', 8);
  webp.writeUInt32LE(10, 16); webp[24] = 29; webp[27] = 19;
  assert.deepEqual(inspectArtwork(webp), { mime: 'image/webp', width: 30, height: 20 });
  const animated = Buffer.from(webp); animated[20] = 2;
  assert.throws(() => inspectArtwork(animated));
  assert.throws(() => inspectArtwork(webp.subarray(0, -1)));
  const hugeWebp = Buffer.from(webp); hugeWebp[25] = 32;
  assert.throws(() => inspectArtwork(hugeWebp));
});
test('WebP admission checks every image header against its canvas and resource bounds', () => {
  const extended = Buffer.alloc(10); // VP8X canvas: 30 by 20.
  extended[4] = 29; extended[7] = 19;
  const lossless = (width: number, height: number) => {
    const result = Buffer.alloc(5); result[0] = 47;
    result.writeUInt32LE((width - 1) | ((height - 1) << 14), 1);
    return result;
  };
  const webp = (...chunks: Buffer[]) => {
    const body = Buffer.concat([Buffer.from('WEBP'), ...chunks]);
    const header = Buffer.alloc(8); header.write('RIFF'); header.writeUInt32LE(body.length, 4);
    return Buffer.concat([header, body]);
  };
  const webpChunk = (name: string, data: Buffer) => {
    const result = Buffer.alloc(8 + data.length + data.length % 2);
    result.write(name); result.writeUInt32LE(data.length, 4); data.copy(result, 8);
    return result;
  };
  assert.deepEqual(inspectArtwork(webp(webpChunk('VP8X', extended), webpChunk('VP8L', lossless(30, 20)))),
    { mime: 'image/webp', width: 30, height: 20 });
  for (const image of [lossless(5000, 1), lossless(4096, 4096), lossless(31, 20)]) {
    assert.throws(() => inspectArtwork(webp(webpChunk('VP8X', extended), webpChunk('VP8L', image))));
  }
});

test('a drag or text-edit gesture creates one undo step and supports redo', () => {
  let state = designReducer(initialHistory, { type: 'begin' });
  for (const x of [55, 60, 70]) state = designReducer(state, { type: 'change', design: { ...state.present, textX: x } });
  assert.equal(state.past.length, 0);
  state = designReducer(state, { type: 'end' });
  assert.equal(state.past.length, 1);
  state = designReducer(state, { type: 'undo' }); assert.equal(state.present.textX, 50);
  state = designReducer(state, { type: 'begin' }); state = designReducer(state, { type: 'end' });
  assert.equal(state.future.length, 1);
  state = designReducer(state, { type: 'redo' }); assert.equal(state.present.textX, 70);
});
test('branching clears redo, history is bounded and undo settles an unfinished gesture', () => {
  let state = initialHistory;
  for (let n = 1; n <= 45; n++) state = designReducer(state, { type: 'change', design: { ...state.present, text: String(n) } });
  assert.equal(state.past.length, 30);
  state = designReducer(state, { type: 'undo' }); assert.equal(state.present.text, '44');
  state = designReducer(state, { type: 'change', design: { ...state.present, shirt: 'navy' } });
  assert.equal(state.future.length, 0);
  state = designReducer(state, { type: 'begin' });
  state = designReducer(state, { type: 'change', design: { ...state.present, rotation: 90 } });
  state = designReducer(state, { type: 'undo' }); assert.equal(state.present.rotation, 0); assert.equal(state.start, null);
});
test('asynchronous artwork completion preserves the current state after undo', () => {
  let state = designReducer(initialHistory, { type: 'change', design: { ...initialDesign, text: 'Before decoding' } });
  state = designReducer(state, { type: 'undo' });
  state = designReducer(state, { type: 'artwork', artwork });
  assert.equal(state.present.text, initialDesign.text); assert.equal(state.present.artwork, artwork);
  state = designReducer(state, { type: 'undo' }); assert.equal(state.present.artwork, null);
});
