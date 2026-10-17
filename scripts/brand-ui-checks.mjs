/** Deterministic SSR and server-gate checks. These do not simulate human or hosted acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url)),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),ts=require('typescript'),root=resolve('.');
export function loader(overrides={}){const cache=new Map();function load(path){if(cache.has(path))return cache.get(path).exports;const source=readFileSync(path,'utf8');const module={exports:{}};cache.set(path,module);const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;function local(name){if(Object.hasOwn(overrides,name))return overrides[name];if(name.endsWith('.css'))return{};const base=name.startsWith('@/')?resolve(root,'apps/web/src',name.slice(2)):name.startsWith('@shared/')?resolve(root,'src/shared',name.slice(8)):name.startsWith('.')?resolve(dirname(path),name):null;if(base){if(/\.[cm]?[jt]sx?$/.test(base))return load(base);try{return load(`${base}.tsx`);}catch(error){if(error.code!=='ENOENT')throw error;return load(`${base}.ts`);}}return require(name);}vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`,{filename:path})(local,module,module.exports);return module.exports;}return load;}
const load=loader(),component=(name,key='default')=>load(resolve(root,'apps/web/src',name))[key];
test('foundation text and action colours meet AA contrast; large gradient headings meet the large-text threshold',()=>{
 function luminance(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
 function contrast(a,b){const pair=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(pair[0]+.05)/(pair[1]+.05);}
 for(const[foreground,background]of [['#182233','#FFFFFF'],['#526178','#FFFFFF'],['#FFFFFF','#0E1424'],['#bdc8db','#0B0F17'],['#a8b7cf','#0B0F17'],['#543298','#FFFFFF']])assert.ok(contrast(foreground,background)>=4.5);
 for(const colour of ['#00C2FF','#007BFF','#7A3BFF','#FF2D8B'])assert.ok(contrast(colour,'#0B0F17')>=3);
});
test('static SVG preserves reference paths and generates distinct IDs for repeated inline instances',()=>{
 const SVG=component('components/brand/VILogoSVG.tsx'),html=renderToStaticMarkup(React.createElement('div',null,React.createElement(SVG),React.createElement(SVG)));
 const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,8);assert.equal(new Set(ids).size,8);
 for(const match of html.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(match[1]));
 for(const colour of ['#00C2FF','#007BFF','#7A3BFF','#FF2D8B'])assert.ok(html.includes(colour));
 assert.match(html,/M 78 96/);assert.match(html,/M 402 26/);assert.match(html,/width="68" height="212"/);
 assert.match(html,/Space Grotesk/);assert.match(html,/DESIGN · PRINT · ORDER · DELIVER/);
  const inherited=renderToStaticMarkup(React.createElement(SVG,{tone:'inherit'}));assert.match(inherited,/<tspan fill="currentColor">VIRTUAL/);
 const dark=renderToStaticMarkup(React.createElement(SVG,{tone:'dark'}));assert.match(dark,/<tspan fill="#FFFFFF">VIRTUAL/);
 const icon=renderToStaticMarkup(React.createElement(SVG,{showWordmark:false,showTagline:false}));assert.doesNotMatch(icon,/<text/);
});
test('logo SSR needs no browser or WebGL, provides the immediate fallback and hides internal controls',()=>{
 const Logo=component('components/brand/VirtualInkAnimatedLogo.tsx');
 for(const animationMode of ['intro','idle','static'])for(const backgroundMode of ['dark','light','transparent']){
  const html=renderToStaticMarkup(React.createElement(Logo,{animationMode,backgroundMode}));
  assert.match(html,/data-logo-state="static"/);assert.match(html,/<svg/);assert.doesNotMatch(html,/<canvas|<button|<select|Rotation speed|Replay/);
 }
 const hero=renderToStaticMarkup(React.createElement(component('components/brand/hero-brand.tsx','HeroBrand')));assert.match(hero,/Skip animation/);
});
test('reviewed geometry bodies match the supplied archive fingerprint',()=>{
 const source=readFileSync('apps/web/src/components/brand/vi-geometry.ts','utf8').replaceAll('\r\n','\n');
 const manifest=JSON.parse(readFileSync('docs/brand-reference-manifest.json','utf8'));
 assert.equal(createHash('sha256').update(source.slice(source.indexOf('const cCyan')).trim()).digest('hex'),manifest.geometryBodySha256);
});
test('informational pages disclose missing services and never fabricate vendors or live payment controls',()=>{
 for(const route of ['marketplace','pricing','delivery','about','support']){
  const html=renderToStaticMarkup(React.createElement(component(`app/${route}/page.tsx`)));
  assert.match(html,/<h1/);assert.doesNotMatch(html,/<form|href="\/(checkout|cart|admin|brand-lab)|[1-5]\.0 out of 5/);
 }
 const html=renderToStaticMarkup(React.createElement(component('app/marketplace/page.tsx')));assert.match(html,/No verified vendor directory/);
});
test('brand lab is denied before rendering on missing setup, wrong role, missing MFA or audit failure',async()=>{
 for(const scenario of ['missing','provider-fails','CUSTOMER','VENDOR','ADMIN','SECURITY_ADMIN','role-array','aal1','missing-step-up','sql-fails','sql-denies','allowed']){
  const calls=[];const identity={aal:scenario==='aal1'?'aal1':'aal2',stepUpAt:scenario==='missing-step-up'?null:123};
  const mocked=loader({'next/headers':{cookies:async()=>({getAll:()=>[],get:()=>undefined})},'next/navigation':{notFound:()=>{throw new Error('synthetic-404');}},'@backend/identity/security-admin.ts':{loadSecurityConfig:()=>scenario==='missing'?undefined:{}},'@/lib/web-auth':{webAuthClient:()=>({})},'@/lib/security-admin':{securityDependencies:async()=>({auth:{identity:async()=>{if(scenario==='provider-fails')throw new Error('unavailable');return identity;}},commands:{run:async(action,input)=>{calls.push({action,input});if(action==='status')return{data:{role:scenario==='role-array'?['SUPER_ADMIN']:['CUSTOMER','VENDOR','ADMIN','SECURITY_ADMIN'].includes(scenario)?scenario:'SUPER_ADMIN'}};if(scenario==='sql-fails')throw new Error('audit');return{data:{authorized:scenario!=='sql-denies'}};}}})}});
  const Page=mocked(resolve(root,'apps/web/src/app/brand-lab/page.tsx')).default;
  if(scenario==='allowed'){const html=renderToStaticMarkup(await Page());assert.match(html,/Replay six-second/);assert.deepEqual(calls.at(-1),{action:'protected.check',input:{capability:'security.read'}});}
  else await assert.rejects(Page(),/synthetic-404/);
  if(['CUSTOMER','VENDOR','ADMIN','SECURITY_ADMIN','role-array','aal1','missing-step-up'].includes(scenario))assert.equal(calls.filter(c=>c.action==='protected.check').length,0);
 }
});
test('animation scheduling preserves six-second formation, suspends safely and disposes every scene resource',()=>{
 const T=require('three'),originals=new Map(),events=new Map(),canvasEvents=new Map(),queue=new Map(),observers=[];
 let clock=0,sequence=0,renders=0,ready=0,reveals=0,complete=0,failed=0,disposedGeometries=0,disposedMaterials=0,contextLoss=0,lastRoot,denyContext=false;
 const geometries=new Set(),materials=new Set();
 function setGlobal(name,value){originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});}
 const doc={hidden:false,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 class Renderer{constructor(){if(denyContext)throw new Error('synthetic-WebGL-unavailable');}setPixelRatio(r){assert.ok(r>=1&&r<=2);}setSize(){}render(scene){renders++;lastRoot=scene.children.find(o=>o instanceof T.Group).children.find(o=>o instanceof T.Group);scene.traverse(o=>{if(o.geometry&&!geometries.has(o.geometry)){geometries.add(o.geometry);o.geometry.addEventListener('dispose',()=>disposedGeometries++);}if(o.material&&!materials.has(o.material)){materials.add(o.material);o.material.addEventListener('dispose',()=>disposedMaterials++);}});}dispose(){}forceContextLoss(){contextLoss++;}}
 function tick(count=1){for(let i=0;i<count;i++){clock+=50;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(clock));}}
 let viewer;
 try{
  setGlobal('document',doc);setGlobal('devicePixelRatio',4);setGlobal('matchMedia',()=>({matches:false}));setGlobal('ResizeObserver',Observer);setGlobal('IntersectionObserver',Observer);setGlobal('requestAnimationFrame',fn=>{const id=++sequence;queue.set(id,fn);return id;});setGlobal('cancelAnimationFrame',id=>queue.delete(id));
  const sceneLoad=loader({three:{...T,WebGLRenderer:Renderer}}),create=sceneLoad(resolve(root,'apps/web/src/components/brand/vi-scene.ts')).createLogoScene;
  const canvas={getBoundingClientRect:()=>({width:640,height:520}),addEventListener:(name,fn)=>canvasEvents.set(name,fn),removeEventListener:name=>canvasEvents.delete(name)};
  const cfg={mode:'intro',autoRotate:true,rotationSpeed:10,paused:false,interactive:true},callbacks={ready:()=>ready++,reveal:()=>reveals++,complete:()=>complete++,failed:()=>failed++};
  viewer=create(canvas,cfg,callbacks);assert.equal(queue.size,0);observers[1].callback([{isIntersecting:true}]);tick(10);assert.equal(ready,1);
  viewer.configure({...cfg,paused:true});tick(5);const pausedRenders=renders;tick(100);assert.equal(renders,pausedRenders);assert.equal(complete,0);
  viewer.configure(cfg);tick(10);observers[1].callback([{isIntersecting:false}]);const offscreen=renders;tick(200);assert.equal(renders,offscreen);assert.equal(complete,0);
  observers[1].callback([{isIntersecting:true}]);tick(5);doc.hidden=true;events.get('visibilitychange')();const hidden=renders;tick(200);assert.equal(renders,hidden);
  doc.hidden=false;events.get('visibilitychange')();tick(130);assert.equal(reveals,1);assert.equal(complete,1);
  viewer.configure({...cfg,mode:'idle',rotationSpeed:8});tick(161);assert.ok(Math.abs(lastRoot.rotation.y-Math.PI*2)<.001);
  viewer.configure({...cfg,mode:'idle',autoRotate:false});tick(2);assert.equal(queue.size,0);viewer.rotate(.5);tick();assert.ok(lastRoot.rotation.y>Math.PI*2);
  viewer.beginDrag();viewer.rotate(.1,.02);tick();const dragged=lastRoot.rotation.y;tick(3);assert.equal(lastRoot.rotation.y,dragged);viewer.endDrag();tick(3);assert.ok(lastRoot.rotation.y>dragged);
  viewer.configure({...cfg,mode:'idle',autoRotate:false,paused:true});tick();const still=lastRoot.rotation.y;viewer.rotate(.2);tick();assert.ok(lastRoot.rotation.y>still);tick(3);assert.equal(queue.size,0);
  let prevented=0;canvasEvents.get('webglcontextlost')({preventDefault:()=>prevented++});assert.equal(prevented,1);assert.equal(failed,1);
  viewer.dispose();viewer=null;assert.equal(disposedGeometries,geometries.size);assert.equal(disposedMaterials,materials.size);assert.equal(contextLoss,1);assert.ok(observers.every(o=>o.disconnected));assert.equal(events.size,0);assert.equal(canvasEvents.size,0);assert.equal(queue.size,0);
  denyContext=true;assert.throws(()=>create(canvas,cfg,callbacks),/synthetic-WebGL-unavailable/);
 }finally{viewer?.dispose();for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});
