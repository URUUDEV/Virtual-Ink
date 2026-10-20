/** Controlled source-component/renderer timing. Not real GPU, device or hosted acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),React=require('react'),T=require('three');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function loader(overrides={},globals={}){
 const cache=new Map(),context=vm.createContext({console,...globals});
 function load(path){
  if(cache.has(path))return cache.get(path).exports;
  const module={exports:{}};cache.set(path,module);
  const compiled=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  function local(name){
   if(Object.hasOwn(overrides,name))return overrides[name];
   const base=name.startsWith('@/')?resolve('apps/web/src',name.slice(2)):name.startsWith('@shared/')?resolve('src/shared',name.slice(8)):name.startsWith('.')?resolve(dirname(path),name):null;
   if(!base)return require(name);
   if(/\.tsx?$/.test(base))return load(base);
   try{return load(`${base}.tsx`);}catch(error){if(error.code!=='ENOENT')throw error;return load(`${base}.ts`);}
  }
  vm.runInContext(`(function(require,module,exports){${compiled}\n})`,context,{filename:path})(local,module,module.exports);return module.exports;
 }
 return load;
}
function preview({paint=async()=>{},update=async()=>{},modelFails=false,flat=false}={}){
 const values=[],effects=new Map(),canvases=[],viewers=[];let cursor,pending,nodes;
 const hooks={...React,
  useState(initial){const slot=cursor++;if(!(slot in values))values[slot]=typeof initial==='function'?initial():initial;return[values[slot],next=>{values[slot]=typeof next==='function'?next(values[slot]):next;}];},
  useRef(initial){const slot=cursor++;if(!(slot in values))values[slot]={current:initial};return values[slot];},
  useEffect(setup,deps){const slot=cursor++,old=effects.get(slot);if(!old||deps.some((value,i)=>!Object.is(value,old.deps[i])))pending.push(()=>{old?.cleanup?.();effects.set(slot,{deps,cleanup:setup()});});}
 };
 const makeCanvas=()=>{const c={width:300,height:150,getContext:()=>({drawImage(){}})};canvases.push(c);return c;};
 const load=loader({react:hooks,'@/lib/studio-paint':{paintLayout:paint},'@/lib/studio-viewer':{createStudioViewer:async()=>{if(modelFails)throw new Error('UNTRUSTED model failure');const v={disposed:0,update,view(){},rotate(){},zoom(){},dispose(){this.disposed++;}};viewers.push(v);return v;}}},{document:{createElement:makeCanvas}});
 const Component=load(resolve('apps/web/src/components/product-studio-preview.tsx')).ProductStudioPreview;
 const props={product:{id:'synthetic-product',modelUrl:flat?null:'/models/studio-v1/crew-unisex.glb'},design:{colour:'#f5f2e9'},surface:'front'};
 function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}nodes.push(node);if(node.props.ref&&!node.props.ref.current)node.props.ref.current=makeCanvas();walk(node.props.children);}
 function render(){cursor=0;pending=[];nodes=[];walk(Component(props));for(const setup of pending)setup();}
 const view={props,render,canvases,viewers,get status(){return nodes.find(n=>n.props.role==='status').props.children.flat(Infinity).join('');},get buttons(){return nodes.filter(n=>n.type==='button').map(n=>n.props.children);},
  click(text){const found=nodes.filter(n=>n.type==='button'&&n.props.children===text);assert.equal(found.length,1,text);found[0].props.onClick();render();},
  unmount(){for(const effect of effects.values())effect.cleanup?.();}
 };render();return view;
}

test('an older texture failure cannot replace a newer successful studio preview with an error',async()=>{
 const old=deferred(),newer=deferred();let updates=0;
 const view=preview({update:()=>++updates===1?old.promise:newer.promise});
 try{await settle();view.render();view.props.design={colour:'#293344'};view.render();newer.resolve();await settle();old.reject(new Error('synthetic stale texture failure'));await settle();view.render();assert.match(view.status,/3D ready/);}finally{view.unmount();}
});

test('switching to layout prevents an abandoned texture error from poisoning a later 3D view',async()=>{
 const old=deferred();let updates=0;const view=preview({update:()=>++updates===1?old.promise:Promise.resolve()});
 try{await settle();view.render();view.click('Layout / fallback');await settle();view.click('3D');await settle();view.render();old.reject(new Error('synthetic abandoned failure'));await settle();view.render();assert.match(view.status,/3D ready/);}finally{view.unmount();}
});

test('layout painting reports its own current failure instead of claiming a valid size layout',async()=>{
 const view=preview({paint:async()=>{throw new Error('UNTRUSTED private decoder detail');}});
 try{view.click('Layout / fallback');await settle();view.render();assert.match(view.status,/Layout could not be drawn/);assert.doesNotMatch(view.status,/UNTRUSTED|Size layout/);}finally{view.unmount();}
});

test('cancelled layout staging is released after its delayed painter settles',async()=>{
 const hold=deferred();let staging;const view=preview({paint:async canvas=>{staging=canvas;canvas.width=900;canvas.height=1000;await hold.promise;canvas.width=900;canvas.height=1000;}});
 try{view.click('Layout / fallback');view.click('3D');hold.resolve();await settle();assert.equal(staging.width,0);assert.equal(staging.height,0);}finally{view.unmount();}
});

async function viewerFixture(paint){
 const canvases=[],textures=[],jobs=new Map(),events=new Map(),canvasEvents=new Map();let sequence=0,renders=0;
 const model=new T.Group(),material=new T.MeshStandardMaterial({name:'front'}),back=new T.MeshStandardMaterial({name:'back'});
 model.add(new T.Mesh(new T.BoxGeometry(.56,.72,.01),[material,back]));
 class Renderer{setPixelRatio(){}setSize(){}render(){renders++;}dispose(){}forceContextLoss(){}}
 class Texture extends T.CanvasTexture{constructor(canvas){super(canvas);this.disposals=0;textures.push(this);}dispose(){this.disposals++;super.dispose();}}
 class Observer{observe(){}disconnect(){}}
 const globals={document:{hidden:false,createElement:()=>{const c={width:300,height:150};canvases.push(c);return c;},addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)},
  matchMedia:()=>({matches:false}),devicePixelRatio:1,ResizeObserver:Observer,IntersectionObserver:Observer,
  requestAnimationFrame:fn=>{const id=++sequence;jobs.set(id,fn);return id;},cancelAnimationFrame:id=>jobs.delete(id)};
 const load=loader({three:{...T,WebGLRenderer:Renderer,CanvasTexture:Texture},'three/addons/loaders/GLTFLoader.js':{GLTFLoader:class{async loadAsync(){return{scene:model};}}},'./studio-paint':{paintZone:paint}},globals);
 const canvas={getBoundingClientRect:()=>({width:600,height:600}),addEventListener:(key,fn)=>canvasEvents.set(key,fn),removeEventListener:key=>canvasEvents.delete(key)};
 const product={modelUrl:'/models/studio-v1/crew-unisex.glb',lighting:{exposure:1},zones:[{surface:'front'},{surface:'back'}]};
 const viewer=await load(resolve('apps/web/src/lib/studio-viewer.ts')).createStudioViewer(canvas,product,()=>{});
 return{viewer,canvases,textures,material,back,events,canvasEvents,jobs,get renders(){return renders;}};
}

test('a superseded texture batch clears its temporary canvases without replacing the current textures',async()=>{
 const old=deferred();const view=await viewerFixture(async(canvas,_p,design)=>{canvas.width=768;canvas.height=768;if(design.colour==='#f5f2e9')await old.promise;});
 try{const stale=view.viewer.update({colour:'#f5f2e9'});await view.viewer.update({colour:'#293344'});const current=view.material.map;
  old.resolve();await stale;assert.equal(view.material.map,current);assert.ok(view.canvases.slice(0,2).every(c=>c.width===0&&c.height===0));assert.ok(view.canvases.slice(2).every(c=>c.width===768));
 }finally{view.viewer.dispose();}
});

test('disposing during painting releases late canvases and creates no textures',async()=>{
 const hold=deferred();const view=await viewerFixture(async canvas=>{canvas.width=768;canvas.height=768;await hold.promise;});
 const pending=view.viewer.update({colour:'#f5f2e9'});view.viewer.dispose();hold.resolve();await pending;
 assert.ok(view.canvases.every(c=>c.width===0&&c.height===0));assert.equal(view.textures.length,0);
});

test('a failed zone waits for its sibling painter before releasing the whole failed batch',async()=>{
 const hold=deferred();const view=await viewerFixture(async(canvas,_p,_d,surface)=>{canvas.width=768;canvas.height=768;if(surface==='front')throw new Error('synthetic failed front');await hold.promise;canvas.width=768;});
 try{const pending=view.viewer.update({colour:'#f5f2e9'});const rejected=assert.rejects(pending,/synthetic failed front/);await settle();hold.resolve();await rejected;
  assert.ok(view.canvases.every(c=>c.width===0&&c.height===0));assert.equal(view.textures.length,0);
 }finally{view.viewer.dispose();}
});

test('a current texture failure still shows a fixed actionable error',async()=>{
 const view=preview({update:async()=>{throw new Error('UNTRUSTED private paint details');}});
 try{await settle();view.render();await settle();view.render();assert.match(view.status,/3D unavailable/);assert.doesNotMatch(view.status,/UNTRUSTED/);}finally{view.unmount();}
});

test('layout retry recovers from failure and announces readiness only after painting finishes',async()=>{
 const hold=deferred();let paints=0;const view=preview({paint:async canvas=>{if(++paints===1)throw new Error('synthetic first failure');await hold.promise;canvas.width=900;canvas.height=1000;}});
 try{view.click('Layout / fallback');await settle();view.render();assert.match(view.status,/Layout could not be drawn/);
  view.click('Retry layout');view.render();assert.match(view.status,/Preparing layout/);hold.resolve();await settle();view.render();assert.match(view.status,/Size layout/);
 }finally{view.unmount();}
});

test('a stale layout rejection cannot replace the newer painted layout status',async()=>{
 const old=deferred();let paints=0;const view=preview({paint:()=>++paints===1?old.promise:Promise.resolve()});
 try{view.click('Layout / fallback');view.props.surface='back';view.render();await settle();view.render();old.reject(new Error('synthetic stale layout'));await settle();view.render();assert.match(view.status,/Size layout/);}finally{view.unmount();}
});

test('committed texture canvases survive until replacement, then release exactly once on disposal',async()=>{
 const view=await viewerFixture(async canvas=>{canvas.width=768;canvas.height=768;});
 await view.viewer.update({colour:'#f5f2e9'});assert.ok(view.canvases.every(c=>c.width===768));const old=[...view.textures];
 await view.viewer.update({colour:'#293344'});assert.ok(old.every(t=>t.disposals===1&&t.image.width===0));assert.ok(view.canvases.slice(2).every(c=>c.width===768));
 view.viewer.dispose();view.viewer.dispose();const count=view.canvases.length;await view.viewer.update({colour:'#f5f2e9'});
 assert.equal(view.canvases.length,count);assert.ok(view.textures.every(t=>t.disposals===1));assert.ok(view.canvases.every(c=>c.width===0&&c.height===0));assert.equal(view.events.size,0);assert.equal(view.canvasEvents.size,0);assert.equal(view.jobs.size,0);
});

test('layout composition clears its internal texture on success, thumbnail failure and canvas failure',async()=>{
 for(const failure of ['none','thumbnail','canvas']){
  const temporary=[];
  const ctx={fillRect(){},save(){},scale(){},translate(){},setLineDash(){},strokeRect(){},restore(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray([245,242,233,255])}),putImageData(){},fillText(){}};
  class Image{set src(_value){queueMicrotask(()=>failure==='thumbnail'?this.onerror():this.onload());}}
  const load=loader({}, {Image,queueMicrotask,document:{createElement:()=>{const canvas={width:300,height:150,getContext:()=>failure==='canvas'?null:ctx};temporary.push(canvas);return canvas;}}});
  const product={previewType:'garment-3d',construction:'crew',dimensionsMm:[560,720,200],frontThumbnail:'/models/studio-v1/crew-unisex-front.svg',zones:[{surface:'front',id:'front',name:'Front',widthMm:280,heightMm:360,safeInsetMm:5}]};
  const pending=load(resolve('apps/web/src/lib/studio-paint.ts')).paintLayout({width:300,height:150,getContext:()=>ctx},product,{colour:'#293344',layers:[],method:'screen-print'},'front');
  failure==='none'?await pending:await assert.rejects(pending);assert.equal(temporary.length,1);assert.equal(temporary[0].width,0);assert.equal(temporary[0].height,0);
 }
});

test('a model-load failure keeps the layout fallback available without exposing loader details',async()=>{
 const view=preview({modelFails:true});
 try{await settle();view.render();assert.match(view.status,/3D unavailable/);assert.doesNotMatch(view.status,/UNTRUSTED/);assert.ok(view.buttons.includes('Layout / fallback'));
  view.click('Layout / fallback');await settle();view.render();assert.match(view.status,/Size layout/);assert.equal(view.viewers.length,0);
 }finally{view.unmount();}
});

test('a flat-only product paints its layout without constructing a 3D viewer',async()=>{
 const view=preview({flat:true});
 try{await settle();view.render();assert.match(view.status,/Size layout/);assert.equal(view.viewers.length,0);assert.ok(!view.buttons.includes('3D'));}finally{view.unmount();}
});
