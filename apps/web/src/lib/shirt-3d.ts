import * as THREE from 'three';
import { paintShirtTexture } from './design-canvas';
import { shirtColours, type Design } from './design-workspace';

const world = (x: number, y: number) => new THREE.Vector2((x - 300) / 170, (320 - y) / 170);
function pattern() {
  const shape = new THREE.Shape();
  const p = world(205, 52); shape.moveTo(p.x, p.y);
  for (const [x, y] of [[135,78],[48,170],[124,228],[176,174],[176,575]]) {
    const point = world(x, y); shape.lineTo(point.x, point.y);
  }
  let control = world(300,598), end = world(424,575);
  shape.quadraticCurveTo(control.x, control.y, end.x, end.y);
  for (const [x, y] of [[424,174],[476,228],[552,170],[465,78],[395,52]]) {
    const point = world(x, y); shape.lineTo(point.x, point.y);
  }
  control = world(381,104); end = world(300,104);
  shape.quadraticCurveTo(control.x, control.y, end.x, end.y);
  control = world(219,104); end = world(205,52);
  shape.quadraticCurveTo(control.x, control.y, end.x, end.y);
  return shape;
}
function depth(x: number, y: number) {
  const body = Math.max(0, 1 - (x / .83) ** 2);
  const drape = .012 * Math.sin(x * 25 + y * 2) + .008 * Math.sin(x * 13 - y * 5);
  return .07 + .26 * Math.sqrt(body) + drape * body;
}
/** Fixed procedural mesh: no external model loading or user-controlled geometry. */
export function createShirtSurfaces() {
  const shape = pattern();
  const flat = new THREE.ShapeGeometry(shape, 24).toNonIndexed();
  const source = flat.getAttribute('position');
  function surface(front: boolean) {
    const positions: number[] = [], normals: number[] = [], uv: number[] = [];
    const sign = front ? 1 : -1;
    function vertex(p: THREE.Vector2) {
      const z = depth(p.x, p.y);
      positions.push(p.x, p.y, sign * z);
      const dx = (depth(p.x + .001, p.y) - depth(p.x - .001, p.y)) / .002;
      const dy = (depth(p.x, p.y + .001) - depth(p.x, p.y - .001)) / .002;
      const n = new THREE.Vector3(-dx, -dy, sign).normalize(); normals.push(n.x, n.y, n.z);
      uv.push((p.x * 170 + 300) / 600, (p.y * 170 + 320) / 640);
    }
    function triangle(a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2, level: number) {
      if (!level) { vertex(a); vertex(front ? b : c); vertex(front ? c : b); return; }
      const ab = a.clone().lerp(b, .5), bc = b.clone().lerp(c, .5), ca = c.clone().lerp(a, .5);
      triangle(a, ab, ca, level - 1); triangle(ab, b, bc, level - 1);
      triangle(ca, bc, c, level - 1); triangle(ab, bc, ca, level - 1);
    }
    for (let i = 0; i < source.count; i += 3) {
      const points = [0,1,2].map(j => new THREE.Vector2(source.getX(i+j), source.getY(i+j)));
      triangle(points[0], points[1], points[2], 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geometry;
  }
  const front = surface(true), back = surface(false);
  flat.dispose();
  const outline = shape.getPoints(48);
  const edges: number[] = [];
  for (let i = 0; i < outline.length - 1; i++) {
    const a = outline[i], b = outline[i+1];
    const az = depth(a.x,a.y), bz = depth(b.x,b.y);
    edges.push(a.x,a.y,az, a.x,a.y,-az, b.x,b.y,bz,
      b.x,b.y,bz, a.x,a.y,-az, b.x,b.y,-bz);
  }
  const side = new THREE.BufferGeometry();
  side.setAttribute('position', new THREE.Float32BufferAttribute(edges,3)); side.computeVertexNormals();
  return { front, back, side };
}
export type ShirtViewer = {
  update: (design: Design) => Promise<void>;
  rotate: (x: number, y: number) => void;
  view: (side: 'front' | 'back' | 'angle') => void;
  zoom: (amount: number) => void;
  snapshot: (design: Design) => Promise<Blob>;
  dispose: () => void;
};
export function createShirtViewer(canvas: HTMLCanvasElement, onLost: () => void): ShirtViewer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 30);
  camera.position.set(0, 0, 7.8); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#ffffff', '#69717d', 2.6));
  const key = new THREE.DirectionalLight('#ffffff', 2.7); key.position.set(-3,4,5); scene.add(key);
  const rim = new THREE.DirectionalLight('#e3e5ff', 1.4); rim.position.set(3,2,-4); scene.add(rim);
  const textureCanvas = document.createElement('canvas'); textureCanvas.width = 600; textureCanvas.height = 640;
  const texture = new THREE.CanvasTexture(textureCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const frontMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: .94, metalness: 0 });
  const backMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .94 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#eeeeee', roughness: 1, side: THREE.DoubleSide });
  const surfaces = createShirtSurfaces();
  const shirt = new THREE.Group(); shirt.add(new THREE.Mesh(surfaces.front,frontMaterial),new THREE.Mesh(surfaces.back,backMaterial),new THREE.Mesh(surfaces.side,edgeMaterial));
  shirt.rotation.set(-.08,-.35,0); scene.add(shirt);
  let disposed = false, frame = 0, revision = 0;
  function draw() {
    if (disposed || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if (!disposed) renderer.render(scene,camera); });
  }
  function resize() {
    const parent = canvas.parentElement;
    const width = Math.max(1, Math.min(parent?.clientWidth || 600, 1200)), height = Math.max(1, Math.min(parent?.clientHeight || 520, 900));
    renderer.setSize(width,height,false); camera.aspect = width / height; camera.updateProjectionMatrix(); draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement || canvas); resize();
  const lost = (event: Event) => { event.preventDefault(); onLost(); };
  canvas.addEventListener('webglcontextlost', lost);
  async function apply(design: Design) {
    const current = ++revision;
    const staging = document.createElement('canvas'); await paintShirtTexture(staging, design);
    if (disposed || current !== revision) return;
    const context = textureCanvas.getContext('2d');
    if (!context) throw new Error('Texture tools are unavailable.');
    context.clearRect(0,0,600,640); context.drawImage(staging,0,0); texture.needsUpdate = true;
    backMaterial.color.set(shirtColours[design.shirt]); edgeMaterial.color.set(shirtColours[design.shirt]).multiplyScalar(.85); draw();
    return current;
  }
  return {
    async update(design) { await apply(design); },
    async snapshot(design) {
      const current = await apply(design);
      if (disposed || !current || current !== revision || renderer.getContext().isContextLost()) throw new Error('The 3D view changed or became unavailable.');
      // Render and copy synchronously; no persistent WebGL drawing buffer is needed.
      renderer.render(scene,camera);
      const output = document.createElement('canvas'); output.width = canvas.width; output.height = canvas.height;
      const context = output.getContext('2d'); if (!context) throw new Error('Image export is unavailable.');
      context.fillStyle = '#f1eee8'; context.fillRect(0,0,output.width,output.height); context.drawImage(canvas,0,0);
      context.fillStyle = '#334155'; context.font = `${Math.max(12, Math.round(output.width / 60))}px sans-serif`; context.textAlign = 'center';
      context.fillText('VIRTUAL INK · CONCEPT PREVIEW', output.width / 2, output.height - 20);
      return new Promise<Blob>((resolve,reject) => output.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image export failed.')), 'image/png'));
    },
    rotate(x,y) { shirt.rotation.y = (shirt.rotation.y + x) % (Math.PI * 2); shirt.rotation.x = Math.max(-.5,Math.min(.5,shirt.rotation.x + y)); draw(); },
    view(side) { shirt.rotation.set(side === 'angle' ? -.08 : 0, side === 'back' ? Math.PI : side === 'angle' ? -.35 : 0, 0); camera.position.z = 7.8; draw(); },
    zoom(amount) { camera.position.z = Math.max(5.8, Math.min(10,camera.position.z + amount)); draw(); },
    dispose() {
      disposed = true; revision++; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('webglcontextlost',lost);
      Object.values(surfaces).forEach(geometry=>geometry.dispose()); texture.dispose(); frontMaterial.dispose(); backMaterial.dispose(); edgeMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
