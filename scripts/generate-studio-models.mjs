/** Original geometric studies, not supplier-certified production assets. Metres, +Y up, +Z front. */
import * as T from '../apps/web/node_modules/three/build/three.module.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { productModels } from '../src/shared/product-models.ts';
const directory = new URL('../apps/web/public/models/studio-v1/', import.meta.url);
await mkdir(directory, { recursive: true });
const pi = Math.PI;
function geometry(points, uv, indices) {
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}
function grid(rows, columns, point, uvPoint) {
  const positions = [], uv = [], indices = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= columns; i++) {
    const v = j / rows, u = i / columns, p = point(u, v); positions.push(...p); uv.push(...uvPoint(u, v, p));
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
    const a = j * (columns + 1) + i, b = a + columns + 1; indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  return geometry(positions, uv, indices);
}
const items = [];
function add(name, g, surface = 'fabric', colour = [1, 1, 1, 1], roughness = .92) { g.normalizeNormals(); items.push({ name, g, surface, colour, roughness }); }
function tube(name, path, radius, surface = 'fabric', segments = 36) {
  add(name, new T.TubeGeometry(new T.CatmullRomCurve3(path.map(p => new T.Vector3(...p))), segments, radius, 8, false), surface);
}
function ring(name, x, y, z, rx, rz, thickness = .003) {
  const path = Array.from({ length: 65 }, (_, i) => [x + rx * Math.sin(i / 64 * pi * 2), y, z + rz * Math.cos(i / 64 * pi * 2)]);
  tube(name, path, thickness);
}
function garment(p) {
  const female = p.cut === 'female', child = p.cut === 'children', male = p.cut === 'male';
  const hoodie = p.construction === 'hoodie', corporate = p.construction === 'corporate';
  const long = p.construction === 'crew-long' || hoodie || corporate;
  const height = child ? .5 : .72, half = child ? .19 : female ? .25 : male ? .29 : .28;
  // Two separately named curved panels, with an open hem and an actual neck opening.
  for (const front of [true, false]) {
    const sign = front ? 1 : -1;
    add(front ? 'front-panel' : 'back-panel', grid(40, 40, (u, v) => {
      const theta = (u - .5) * pi, y = -height + v * height;
      let width = half * (1 - (female ? .14 : .04) * Math.sin(v * pi));
      if (v > .86) width = T.MathUtils.lerp(half, .092 * (child ? .72 : 1), (v - .86) / .14);
      const x = Math.sin(theta) * width;
      const fold = .004 * Math.sin(u * 32 + v * 7) * Math.sin(v * pi) + .002 * Math.sin(v * 33 + u * 9);
      let z = sign * (.085 * (child ? .75 : 1) * Math.cos(theta) + fold);
      const neckDip = v > .93 ? (v - .93) / .07 * (front ? .045 : .012) * Math.cos(theta) : 0;
      if (hoodie) z *= 1.15;
      return [x, y - neckDip, z];
    }, (_u, _v, point) => [(front ? point[0] : -point[0]) / (half * 2) + .5, (point[1] + height) / height]), front ? 'front' : 'back');
  }
  ring('double-stitched-hem', 0, -height + .008, 0, half, .086 * (child ? .75 : 1));
  ring('ribbed-neck-binding', 0, -.025, 0, .094 * (child ? .72 : 1), .064 * (child ? .75 : 1), .006);
  // Separate tapering sleeve tubes; short sleeves and wrist-length sleeves are different geometry.
  for (const side of [-1, 1]) {
    const start = new T.Vector3(side * half * .82, -.10, 0);
    const end = new T.Vector3(side * (half + (long ? .26 : .15)) * (child ? .9 : 1), long ? -height * .88 : -.23 * (child ? .8 : 1), 0);
    const direction = end.clone().sub(start).normalize(), tangent = new T.Vector3(-direction.y, direction.x, 0);
    const radius = (child ? .057 : .078) * (hoodie ? 1.15 : 1);
    add(side < 0 ? 'right-sleeve' : 'left-sleeve', grid(22, 28, (u, v) => {
      const c = start.clone().lerp(end, v), a = u * pi * 2;
      const r = radius * (1 - v * (long ? .47 : .18)) + .002 * Math.sin(v * 45 + a * 3);
      return c.addScaledVector(tangent, Math.cos(a) * r).add(new T.Vector3(0, 0, Math.sin(a) * r)).toArray();
    }, (u, v) => [u, v]));
    const cuffPath = Array.from({ length: 49 }, (_, i) => {
      const a = i / 48 * pi * 2, r = radius * (long ? .53 : .82);
      return end.clone().addScaledVector(tangent, Math.cos(a) * r).add(new T.Vector3(0, 0, Math.sin(a) * r)).toArray();
    });
    tube(side < 0 ? 'right-cuff-hem' : 'left-cuff-hem', cuffPath, long && hoodie ? .008 : .003);
    tube(side < 0 ? 'right-shoulder-seam' : 'left-shoulder-seam', [[side * .09, -.02, .025], [side * half * .7, -.065, .046], [side * half, -.13, .04]], .0015);
  }
  if (p.construction === 'polo' || corporate) {
    for (const side of [-1, 1]) {
      const g = geometry([0,-.045,.077, side*.10,.015,.035, side*.14,-.075,.087, side*.065,-.14,.095], [0,1,1,1,1,0,0,0], [0,1,2,0,2,3]);
      add(side < 0 ? 'right-collar-leaf' : 'left-collar-leaf', g);
    }
    tube('button-placket', [[0,-.065,.09], [0,corporate ? -.69 : -.22,.095]], .008);
    for (let i = 0; i < (corporate ? 7 : 3); i++) {
      const button = new T.SphereGeometry(.004, 10, 6); button.scale(1,1,.35); button.translate(0,-.10-i*.08,.106); add(`button-${i + 1}`, button, 'buttons', [.72,.72,.72,1], .55);
    }
    if (corporate) tube('chest-pocket-seam', [[-.18,-.24,.083],[-.18,-.34,.085],[-.08,-.34,.092],[-.08,-.24,.095]], .002);
  }
  if (hoodie) {
    add('hood-outer-shell', grid(22, 32, (u,v) => {
      const a = u * pi * 1.7 + .15 * pi, b = .005 + v * pi * .82;
      return [.14 * Math.sin(b) * Math.cos(a), .05 + .22 * Math.cos(b), -.045 + .12 * Math.sin(b) * Math.sin(a)];
    }, (u,v) => [u,v]));
    for (const side of [-1,1]) tube(`drawstring-${side}`, [[side*.055,-.025,.10],[side*.05,-.12,.113],[side*.06,-.21,.106]], .003);
    const pocket = new T.Shape(); pocket.moveTo(-.17,-.48); pocket.lineTo(-.11,-.41); pocket.lineTo(.11,-.41); pocket.lineTo(.17,-.48); pocket.lineTo(.17,-.63); pocket.lineTo(-.17,-.63); pocket.closePath();
    const g = new T.ExtrudeGeometry(pocket, { depth:.006, bevelEnabled:true, bevelThickness:.003, bevelSize:.004, bevelSegments:2, steps:1 }); g.translate(0,0,.098); add('kangaroo-pocket',g);
  }
}
function mug() {
  // Lathed closed ceramic section: base, outer body, rounded lip and inner wall.
  const points = [[0,0],[.036,0],[.041,.005],[.041,.091],[.040,.095],[.037,.095],[.036,.091],[.036,.009],[0,.009]].map(([x,y]) => new T.Vector2(x,y));
  add('ceramic-body-rim-interior', new T.LatheGeometry(points, 72), 'ceramic', [1,1,1,1], .24);
  // Independent 300-degree printable cylinder leaves a 60-degree handle clearance.
  add('printable-wrap', grid(12, 72, (u,v) => { const a = pi/6 + u*pi*5/3; return [.04115*Math.cos(a),.012+v*.070,.04115*Math.sin(a)]; }, (u,v) => [1-u,v]), 'wrap', [1,1,1,1], .24);
  const path = [[.037,.078,0],[.066,.081,0],[.078,.061,0],[.073,.034,0],[.041,.021,0]];
  tube('ceramic-handle', path, .007, 'ceramic', 42);
}
/** Small self-contained GLB, no network resources or private textures. */
function glb(id) {
  const chunks = [], accessors = [], bufferViews = [], meshes = [], nodes = [], materials = [];
  let offset = 0;
  function accessor(array, components, type, target) {
    const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength), padded = Buffer.alloc(Math.ceil(data.length / 4) * 4); data.copy(padded);
    const view = bufferViews.length; bufferViews.push({ buffer:0,byteOffset:offset,byteLength:data.length,target }); chunks.push(padded); offset += padded.length;
    const a = { bufferView:view,componentType:type,count:array.length/components,type:components===1?'SCALAR':components===2?'VEC2':'VEC3' };
    if (components === 3) { a.min = [Infinity,Infinity,Infinity]; a.max = [-Infinity,-Infinity,-Infinity]; for (let i=0;i<array.length;i++) { const axis=i%3;a.min[axis]=Math.min(a.min[axis],array[i]);a.max[axis]=Math.max(a.max[axis],array[i]); } }
    accessors.push(a); return accessors.length-1;
  }
  for (const item of items) {
    const g = item.g;
    const attributes = { POSITION:accessor(g.attributes.position.array,3,5126,34962), NORMAL:accessor(g.attributes.normal.array,3,5126,34962), TEXCOORD_0:accessor(g.attributes.uv.array,2,5126,34962) };
    let material = materials.findIndex(m => m.name === item.surface);
    if (material < 0) { material = materials.length; materials.push({ name:item.surface,doubleSided:true,pbrMetallicRoughness:{ baseColorFactor:item.colour,metallicFactor:0,roughnessFactor:item.roughness } }); }
    meshes.push({ name:item.name,primitives:[{ attributes,indices:accessor(new Uint32Array(g.index ? g.index.array : Array.from({length:g.attributes.position.count},(_,i)=>i)),1,5125,34963),material }] });
    nodes.push({ name:item.name,mesh:meshes.length-1 }); g.dispose();
  }
  const document = { asset:{version:'2.0',generator:'Virtual Ink original geometry studies v1',copyright:'Virtual Ink project contributors; original demonstration geometry'},scene:0,scenes:[{name:id,nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials,accessors,bufferViews,buffers:[{byteLength:offset}],extras:{units:'metres',productionVerified:false,modelVersion:'original-study-1'} };
  const jsonSource=Buffer.from(JSON.stringify(document)), json=Buffer.alloc(Math.ceil(jsonSource.length/4)*4,32);jsonSource.copy(json);
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+offset,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const binaryHeader=Buffer.alloc(8);binaryHeader.writeUInt32LE(offset,0);binaryHeader.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,json,binaryHeader,...chunks]);
}
function fallback(p, back) {
  let shape;
  if(p.previewType==='flat-2d') shape='<rect x="55" y="160" width="490" height="272" rx="3"/>';
  else if(p.previewType==='vessel-3d') shape='<path d="M180 180 Q300 150 420 180 L420 440 Q300 475 180 440 Z"/><path d="M420 210 C540 190 540 410 420 400 L420 365 C485 375 485 240 420 245 Z"/><ellipse cx="300" cy="180" rx="120" ry="24" fill="#d8d8d4"/>';
  else {
    const long=['crew-long','hoodie','corporate'].includes(p.construction), fitted=p.cut==='female';
    shape=`<path d="M230 90 L190 105 L${long?'55 330 110 365 175 215':'65 190 130 235 180 180'} L${fitted?'197 335 180':'180'} 535 Q300 552 420 535 L${fitted?'403 335 420':'420'} 180 L${long?'490 365 545 330':'470 235 535 190'} L410 105 L370 90 Q360 ${back?'112':'150'} 300 ${back?'112':'150'} Q240 ${back?'112':'150'} 230 90 Z"/>`;
    if(p.construction==='polo'||p.construction==='corporate') shape+='<path d="M230 90 L270 155 300 122 330 155 370 90 M300 122 L300 260" fill="none" stroke="#727985" stroke-width="5"/>';
    if(p.construction==='hoodie') shape+='<path d="M230 105 C190 -5 410 -5 370 105 Q300 70 230 105 Z"/><path d="M225 400 L250 375 H350 L375 400 V495 H225 Z"/>';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 640"><rect width="600" height="640" fill="#f1eee8"/><g fill="#f5f2e9" stroke="#88909a" stroke-width="2">${shape}</g><text x="300" y="600" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#4b5563">${back?'BACK':'FRONT'} · ORIGINAL GEOMETRY STUDY</text></svg>`;
}
for (const product of productModels) {
  items.length=0;
  if(product.previewType!=='flat-2d') { if(product.previewType==='vessel-3d') mug(); else garment(product); const data=glb(product.id); await writeFile(new URL(`${product.id}.glb`,directory),data); console.log(`${product.id}: ${data.length} bytes`); }
  for(const back of [false,true]) await writeFile(new URL(`${product.id}-${back?'back':'front'}.svg`,directory),fallback(product,back));
}
