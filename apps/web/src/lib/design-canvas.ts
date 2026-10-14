import { inspectArtwork, maxArtworkBytes, shirtColours, type Artwork, type Design } from './design-workspace';
import { fontCSS } from './design-fonts';
export const previewSize = { width: 600, height: 640 };
export const printArea = { x: 194, y: 168, width: 212, height: 280 };
function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened. Choose another still image.'));
    image.src = source;
  });
}
export async function prepareArtwork(file: File): Promise<Artwork> {
  if (file.size < 1 || file.size > maxArtworkBytes) throw new Error('Choose a PNG, JPEG or WebP image up to 2 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const declared = inspectArtwork(bytes);
  const url = URL.createObjectURL(new Blob([bytes], { type: declared.mime }));
  try {
    const image = await loadImage(url);
    if (image.naturalWidth !== declared.width || image.naturalHeight !== declared.height) throw new Error('The image dimensions could not be verified.');
    const scale = Math.min(1, 1024 / Math.max(declared.width, declared.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(declared.width * scale));
    canvas.height = Math.max(1, Math.round(declared.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image tools are unavailable in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/png');
    if (data.length > 2_796_230) throw new Error('This artwork remains too large after preparation. Try a smaller image.');
    // Re-encoding strips source metadata; only this bounded PNG enters design state.
    return { data, width: canvas.width, height: canvas.height };
  } finally { URL.revokeObjectURL(url); }
}
function centred(percent: number, start: number, extent: number, item: number) {
  return Math.max(start + item / 2, Math.min(start + extent - item / 2, start + extent * percent / 100));
}
export async function paintDesign(canvas: HTMLCanvasElement, design: Design, guides = true): Promise<void> {
  const image = design.artwork ? await loadImage(design.artwork.data) : null;
  await document.fonts.load(fontCSS(design.font, design.textSize), design.text || 'Ink');
  await document.fonts.ready;
  canvas.width = previewSize.width; canvas.height = previewSize.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Preview tools are unavailable in this browser.');
  context.fillStyle = '#f4f1ec'; context.fillRect(0, 0, canvas.width, canvas.height);
  const shirt = new Path2D('M205 52 L135 78 L48 170 L124 228 L176 174 L176 575 Q300 598 424 575 L424 174 L476 228 L552 170 L465 78 L395 52 Q381 104 300 104 Q219 104 205 52 Z');
  context.save(); context.shadowColor = '#15243b20'; context.shadowBlur = 18; context.shadowOffsetY = 12;
  context.fillStyle = shirtColours[design.shirt]; context.fill(shirt); context.restore();
  context.strokeStyle = design.shirt === 'white' ? '#d5d9de' : '#ffffff35'; context.lineWidth = 2; context.stroke(shirt);
  context.beginPath(); context.moveTo(207, 58); context.bezierCurveTo(234, 117, 366, 117, 393, 58); context.stroke();
  context.beginPath(); context.moveTo(190, 565); context.quadraticCurveTo(300, 584, 410, 565); context.stroke();
  if (guides) {
    context.save(); context.strokeStyle = design.shirt === 'white' ? '#78919980' : '#d2e0e080';
    context.lineWidth = 1; context.setLineDash([6, 5]); context.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height); context.restore();
  }
  paintContent(context, design, image);
}
/** The 3D mesh uses the same coordinate space and placement as the 2D guide. */
export async function paintShirtTexture(canvas: HTMLCanvasElement, design: Design): Promise<void> {
  const image = design.artwork ? await loadImage(design.artwork.data) : null;
  await document.fonts.load(fontCSS(design.font, design.textSize), design.text || 'Ink');
  canvas.width = previewSize.width; canvas.height = previewSize.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Preview tools are unavailable in this browser.');
  context.fillStyle = shirtColours[design.shirt]; context.fillRect(0, 0, canvas.width, canvas.height);
  paintContent(context, design, image);
}
function paintContent(context: CanvasRenderingContext2D, design: Design, image: HTMLImageElement | null) {
  if (image && design.artwork) {
    const box = printArea.width * design.artSize / 100;
    const scale = box / Math.max(image.naturalWidth, image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    const x = centred(design.artX, printArea.x, printArea.width, width);
    const y = centred(design.artY, printArea.y, printArea.height, height);
    context.drawImage(image, x - width / 2, y - height / 2, width, height);
  }
  if (design.text.trim()) {
    const lines = design.text.split('\n');
    let size = design.textSize;
    const font = () => fontCSS(design.font, size);
    context.font = font();
    let width = Math.max(...lines.map(line => context.measureText(line).width), 1);
    size *= Math.min(1, printArea.width * .9 / width);
    context.font = font();
    width = Math.max(...lines.map(line => context.measureText(line).width), 1);
    let height = size * 1.25 * lines.length;
    const angle = design.rotation * Math.PI / 180;
    const c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle));
    const fit = Math.min(1, printArea.width * .95 / (width * c + height * s), printArea.height * .95 / (width * s + height * c));
    width *= fit; height *= fit; size *= fit;
    const boundWidth = width * c + height * s, boundHeight = width * s + height * c;
    const x = centred(design.textX, printArea.x, printArea.width, boundWidth);
    const y = centred(design.textY, printArea.y, printArea.height, boundHeight);
    context.save(); context.translate(x, y); context.rotate(angle); context.font = font();
    context.fillStyle = design.colour; context.textAlign = 'center'; context.textBaseline = 'middle';
    lines.forEach((line, index) => context.fillText(line, 0, (index - (lines.length - 1) / 2) * size * 1.25)); context.restore();
  }
}
