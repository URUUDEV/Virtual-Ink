import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { type ProductModel } from '@shared/product-models';
import { type StudioDesign } from '@shared/studio-design';
import { paintZone } from './studio-paint';
export type StudioViewer = { update: (design: StudioDesign) => Promise<void>; rotate: (dx: number,dy: number) => void; view: (side: 'front'|'back') => void; zoom: (delta:number) => void; dispose: () => void };
export async function createStudioViewer(canvas: HTMLCanvasElement, p: ProductModel, onLost: () => void): Promise<StudioViewer> {
  if(!p.modelUrl || !/^\/models\/studio-v1\/[a-z-]+\.glb$/.test(p.modelUrl)) throw new Error('A reviewed model URL is required.');
  // Late completion is disposed by the owning component.
  const gltf=await new GLTFLoader().loadAsync(p.modelUrl);
  let renderer: T.WebGLRenderer;
  try { renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:!matchMedia('(pointer: coarse)').matches,powerPreference:'low-power'}); }
  catch(error) { release(gltf.scene); throw error; }
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer: coarse)').matches?1:1.5));
  renderer.outputColorSpace=T.SRGBColorSpace; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=p.lighting.exposure;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(32,1,.001,20), root=new T.Group();
  const bounds=new T.Box3().setFromObject(gltf.scene), size=bounds.getSize(new T.Vector3()), centre=bounds.getCenter(new T.Vector3());
  gltf.scene.position.sub(centre);root.add(gltf.scene);root.rotation.y=-.25;scene.add(root);
  const distance=Math.max(size.x,size.y)*2.3;camera.position.set(0,0,distance);camera.lookAt(0,0,0);
  scene.add(new T.HemisphereLight('#ffffff','#626674',2.6));
  const key=new T.DirectionalLight('#ffffff',3);key.position.set(-2,3,4);scene.add(key);
  const rim=new T.DirectionalLight('#d5d3f0',2);rim.position.set(2,1,-3);scene.add(rim);
  let disposed=false,frame=0,revision=0,visible=true;
  function draw() { if(disposed||frame||!visible||document.hidden)return;frame=requestAnimationFrame(()=>{frame=0;if(!disposed&&visible&&!document.hidden)renderer.render(scene,camera);}); }
  function resize() { const box=canvas.getBoundingClientRect();const w=Math.max(1,box.width),h=Math.max(1,box.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw(); }
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;draw();});intersection.observe(canvas);
  document.addEventListener('visibilitychange',draw);
  const lost=(event:Event)=>{event.preventDefault();onLost();};canvas.addEventListener('webglcontextlost',lost);resize();
  const textures=new Map<string,T.CanvasTexture>();
  return {
    async update(design) {
      if(disposed)return;
      const current=++revision;
      const pending:{surface:string;canvas:HTMLCanvasElement}[]=[],retained=new Set<HTMLCanvasElement>();
      try {
      // A sibling painter can still be using its canvas after another zone fails.
      const results=await Promise.allSettled(p.zones.map(async z=>{const c=document.createElement('canvas');pending.push({surface:z.surface,canvas:c});await paintZone(c,p,design,z.surface);}));
      if(disposed||current!==revision)return;
      const failure=results.find(result=>result.status==='rejected');if(failure?.status==='rejected')throw failure.reason;
      gltf.scene.traverse(object=>{if(!(object instanceof T.Mesh))return;const materials=Array.isArray(object.material)?object.material:[object.material];
        materials.forEach((m:T.MeshStandardMaterial)=>{if(m.name!=='buttons')m.color.set(design.colour);});});
      for(const {surface,canvas:painted} of pending) {
        const old=textures.get(surface);if(old){const c=old.image as HTMLCanvasElement;c.width=0;c.height=0;old.dispose();}const texture=new T.CanvasTexture(painted);texture.flipY=true;texture.colorSpace=T.SRGBColorSpace;textures.set(surface,texture);retained.add(painted);
        gltf.scene.traverse(object=>{if(!(object instanceof T.Mesh))return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach((m:T.MeshStandardMaterial)=>{if(m.name===surface){m.map=texture;m.color.set('#ffffff');m.needsUpdate=true;}});});
      }
      draw();
      } finally {for(const {canvas:temporary} of pending)if(!retained.has(temporary)){temporary.width=0;temporary.height=0;}}
    },
    rotate(dx,dy) {root.rotation.y+=dx;root.rotation.x=Math.max(-.6,Math.min(.6,root.rotation.x+dy));draw();},
    view(side) {root.rotation.set(0,side==='back'?Math.PI:0,0);camera.position.z=distance;draw();},
    zoom(delta) {camera.position.z=Math.max(distance*.65,Math.min(distance*1.7,camera.position.z+delta*distance));draw();},
    dispose() {if(disposed)return;disposed=true;revision++;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',draw);canvas.removeEventListener('webglcontextlost',lost);textures.forEach(t=>{const c=t.image as HTMLCanvasElement;c.width=0;c.height=0;t.dispose();});release(gltf.scene);renderer.dispose();renderer.forceContextLoss();},
  };
}
function release(root:T.Object3D) { const materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose()); }
