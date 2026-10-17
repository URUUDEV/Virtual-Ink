/** Header limits before decoding. This is not malware scanning or print preflight. */
export const maxArtworkBytes = 2 * 1024 * 1024;
export const maxArtworkDimension = 4096;
export function dimensions(width: number, height: number, maximum = maxArtworkDimension) {
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
