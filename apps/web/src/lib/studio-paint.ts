import { type ProductModel } from '@shared/product-models';
import { type StudioDesign, type StudioLayer } from '@shared/studio-design';
import { fontCSS } from './design-fonts';

function image(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const element = new Image(); element.onload = () => resolve(element); element.onerror = () => reject(new Error('Artwork could not be decoded.')); element.src = source; });
}
export async function paintZone(canvas: HTMLCanvasElement, product: ProductModel, design: StudioDesign, surface: string, guides = false, transparent = false) {
  const zone = product.zones.find(z => z.surface === surface);
  canvas.width = 768; canvas.height = 768;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas tools are unavailable.');
  if(!transparent){ctx.fillStyle = design.colour; ctx.fillRect(0,0,768,768);}
  if (!zone) return;
  const vessel = product.previewType === 'vessel-3d', flat = product.previewType === 'flat-2d';
  const width = vessel || flat ? zone.widthMm : product.dimensionsMm[0], height = vessel || flat ? zone.heightMm : product.dimensionsMm[1];
  const x = vessel || flat ? 0 : product.construction === 'corporate' && surface === 'front' ? width * .66 : (width - zone.widthMm) / 2;
  const y = vessel || flat ? 0 : height * .19;
  ctx.save(); ctx.scale(768/width,768/height); ctx.translate(x,y);
  if (guides) { ctx.strokeStyle = '#5d36b7'; ctx.lineWidth = .6; ctx.setLineDash([3,2]); ctx.strokeRect(zone.safeInsetMm,zone.safeInsetMm,zone.widthMm-zone.safeInsetMm*2,zone.heightMm-zone.safeInsetMm*2); ctx.setLineDash([]); }
  for (const l of design.layers.filter(layer => layer.zoneId === zone.id)) await paintLayer(ctx,l,design.method==='embroidery');
  ctx.restore();
}
async function paintLayer(ctx: CanvasRenderingContext2D, l: StudioLayer, stitch: boolean) {
  ctx.save();
  try {
    ctx.translate(l.x,l.y); ctx.rotate(l.rotation*Math.PI/180);
    if (l.kind === 'image' && l.image) ctx.drawImage(await image(l.image),-l.width/2,-l.height/2,l.width,l.height);
    else {
      await document.fonts.load(fontCSS(l.font,40),l.text || 'Ink');
      const lines=l.text.split('\n');ctx.font=fontCSS(l.font,40);
      const width=Math.max(1,...lines.map(line=>ctx.measureText(line).width));
      ctx.scale(l.width/width,l.height/(lines.length*50));ctx.fillStyle=l.colour;ctx.textAlign='center';ctx.textBaseline='middle';
      lines.forEach((line,i)=>ctx.fillText(line,0,(i-(lines.length-1)/2)*50));
    }
    if(stitch) { ctx.globalAlpha=.2;ctx.strokeStyle='#ffffff';ctx.lineWidth=.2; for(let y=-l.height/2;y<l.height/2;y+=1) { ctx.beginPath();ctx.moveTo(-l.width/2,y);ctx.lineTo(l.width/2,y+.5);ctx.stroke(); } }
  } finally { ctx.restore(); }
}
/** A size-accurate layout proof, independent of WebGL and camera state. */
export async function paintLayout(canvas: HTMLCanvasElement, product: ProductModel, design: StudioDesign, surface: string) {
  const zone = product.zones.find(z=>z.surface===surface); if(!zone) throw new Error('No printable surface.');
  const texture=document.createElement('canvas');
  try {
  await paintZone(texture,product,design,surface,true,product.previewType==='garment-3d');
  canvas.width=900;canvas.height=1000;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas tools are unavailable.');
  ctx.fillStyle='#f1eee8';ctx.fillRect(0,0,900,1000);
  const fallback=await image(surface==='back'?product.backThumbnail:product.frontThumbnail);
  ctx.drawImage(fallback,0,0,900,960);
  const blank=ctx.getImageData(0,0,900,960),rgb=[1,3,5].map(offset=>parseInt(design.colour.slice(offset,offset+2),16));
  for(let i=0;i<blank.data.length;i+=4)if(blank.data[i]===245&&blank.data[i+1]===242&&blank.data[i+2]===233){blank.data[i]=rgb[0];blank.data[i+1]=rgb[1];blank.data[i+2]=rgb[2];}
  ctx.putImageData(blank,0,0);
  // Separate plan inset avoids pretending a flattened mug wrap is a cylindrical photograph.
  const vessel=product.previewType==='vessel-3d',flat=product.previewType==='flat-2d';
  const w=vessel?740:flat?768:360,h=vessel?259:flat?448:667.5;
  ctx.drawImage(texture,(900-w)/2,vessel?655:flat?240:135,w,h);
  if(flat){ctx.strokeStyle='#28364c';ctx.lineWidth=1;ctx.setLineDash([]);ctx.strokeRect(90,264,720,400);}
  ctx.fillStyle='#263344';ctx.font='17px sans-serif';ctx.textAlign='center';
  ctx.fillText(`${zone.name} · ${zone.widthMm} × ${zone.heightMm} mm · dashed safe area`,450,950);
  ctx.fillText('LAYOUT STUDY · NOT A VENDOR PRODUCTION PROOF',450,980);
  } finally {texture.width=0;texture.height=0;}
}
