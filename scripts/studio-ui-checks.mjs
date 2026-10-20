/** Actual studio handlers with controlled decoder/painter timing. Not real-browser race acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),React=require('react');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQp8AAAAASUVORK5CYII=';
const artwork={data:png,width:1,height:1};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

function studio({prepare=async()=>artwork,paint=async()=>{}}={}){
  const values=[],cleanups=[],cache=new Map(),saved=new Map(),downloads=[],canvases=[];
  let cursor=0,nodes=[],decodeCalls=0;
  const Preview=()=>null;
  const hooks={...React,
    useState(initial){const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],next=>{values[i]=typeof next==='function'?next(values[i]):next;}];},
    useRef(initial){const i=cursor++;if(!(i in values))values[i]={current:initial};return values[i];},
    useEffect(setup){const i=cursor++;if(!(i in values)){values[i]=true;cleanups.push(setup());}}
  };
  const overrides={react:hooks,'next/link':{__esModule:true,default:()=>null},'./product-studio-preview':{ProductStudioPreview:Preview},
    '@/lib/design-canvas':{prepareArtwork:async file=>{decodeCalls++;return prepare(file);}},
    '@/lib/local-download':{downloadLocal:(blob,name)=>downloads.push({blob,name})},'@/lib/studio-paint':{paintLayout:paint}};
  const context=vm.createContext({console,crypto:{randomUUID},atob,Uint8Array,Blob,
    localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},
    document:{createElement(name){assert.equal(name,'canvas');const canvas={width:900,height:1000,toDataURL:()=>png};canvases.push(canvas);return canvas;}}});
  function load(path){
    if(cache.has(path))return cache.get(path).exports;
    const module={exports:{}};cache.set(path,module);
    const compiled=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    function local(name){
      if(name.endsWith('.css'))return {};
      if(Object.hasOwn(overrides,name))return overrides[name];
      const base=name.startsWith('@/')?resolve('apps/web/src',name.slice(2)):name.startsWith('@shared/')?resolve('src/shared',name.slice(8)):name.startsWith('.')?resolve(dirname(path),name):null;
      if(!base)return require(name);
      if(/\.tsx?$/.test(base))return load(base);
      try{return load(`${base}.tsx`);}catch(error){if(error.code!=='ENOENT')throw error;return load(`${base}.ts`);}
    }
    vm.runInContext(`(function(require,module,exports){${compiled}\n})`,context,{filename:path})(local,module,module.exports);return module.exports;
  }
  const {ProductStudio}=load(resolve('apps/web/src/components/product-studio.tsx'));
  function text(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(text).join('');return typeof node==='object'?text(node.props.children):String(node);}
  function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}nodes.push({type:node.type,props:node.props,text:text(node)});walk(node.props.children);}
  function render(){cursor=0;nodes=[];walk(ProductStudio());}
  function find(type,label){const matches=nodes.filter(n=>n.type===type&&n.text===label);assert.equal(matches.length,1,`${type}: ${label}`);return matches[0];}
  const view={render,saved,downloads,canvases,
    get design(){return nodes.find(n=>n.type===Preview).props.design;},
    get message(){return nodes.find(n=>n.props.role==='status').text;},
    get busy(){return nodes.find(n=>n.type==='input'&&n.props.accept==='image/png,image/jpeg').props.disabled;},
    get decodeCalls(){return decodeCalls;},
    get measurementFields(){return nodes.filter(n=>n.type==='input'&&['x','y','width','height','rotation'].includes(n.props.name)).map(n=>n.props);},
    measurements(values={}){const form=find('form',nodes.find(n=>n.type==='form')?.text);const fields=view.measurementFields;
      form.props.onSubmit({preventDefault(){},currentTarget:{reset(){},elements:{namedItem:name=>({value:String(Object.hasOwn(values,name)?values[name]:fields.find(f=>f.name===name).defaultValue)})}}});render();},
    click(label){const result=find('button',label).props.onClick();render();return result;},
    file(accept,file){const input=nodes.find(n=>n.type==='input'&&n.props.accept===accept);const target={files:[file],value:'synthetic'};input.props.onChange({target,currentTarget:target});render();},
    change(label,value){const parents=nodes.filter(n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]===label);assert.equal(parents.length,1,label);const parent=parents[0];
      const child=parent.props.children;const control=(Array.isArray(child)?child:[child]).find(n=>n&&typeof n==='object'&&n.props.onChange);assert.ok(control);control.props.onChange({target:{value}});render();},
    unmount(){for(const cleanup of cleanups)cleanup?.();}
  };
  render();return view;
}
const pick=(view)=>view.file('image/png,image/jpeg',{type:'image/png',size:68});

test('selected artwork exposes five labelled decimal measurement controls with native constraints',()=>{
  const view=studio();assert.equal(view.measurementFields.length,0);view.click('+ Add text');
  assert.deepEqual(view.measurementFields.map(f=>f.name),['x','y','width','height','rotation']);
  for(const field of view.measurementFields){assert.equal(field.type,'number');assert.equal(field.step,'any');assert.equal(field.required,true);assert.ok(field.id);assert.equal(field['aria-describedby'],'studio-measurements-help');}
  const width=view.measurementFields.find(f=>f.name==='width'),rotation=view.measurementFields.find(f=>f.name==='rotation');
  assert.equal(width.min,.1);assert.equal(width.max,280);assert.equal(rotation.min,-180);assert.equal(rotation.max,180);view.unmount();
});

test('decimal measurements apply together as one undoable edit and preserve the layer content',()=>{
  const view=studio();view.click('+ Add text');const original=JSON.stringify(view.design);
  view.measurements({x:'110.25',y:'150.75',width:'88.5',height:'29.5',rotation:'-12.5'});
  const changed=JSON.stringify(view.design),layer=view.design.layers[0];
  for(const [field,value]of Object.entries({x:110.25,y:150.75,width:88.5,height:29.5,rotation:-12.5}))assert.equal(layer[field],value);
  assert.equal(layer.text,'YOUR IDEA');view.click('Undo');assert.equal(JSON.stringify(view.design),original);view.click('Redo');assert.equal(JSON.stringify(view.design),changed);view.unmount();
});

test('empty, nonfinite and out-of-range measurements preserve the design and history',()=>{
  for(const values of [{x:''},{x:' '},{x:'NaN'},{x:'Infinity'},{x:'1e309'},{x:'-1'},{x:'281'},{y:'361'},{width:'0'},{width:'280.1'},{height:'-.1'},{rotation:'180.1'},{rotation:'-180.1'}]){
    const view=studio();view.click('+ Add text');const original=JSON.stringify(view.design);view.measurements(values);
    assert.equal(JSON.stringify(view.design),original);assert.match(view.message,/Enter .* between/);view.click('Undo');assert.equal(view.design.layers.length,0);view.unmount();
  }
});

test('unchanged measurement submission creates no history entry',()=>{
  const view=studio();view.click('+ Add text');view.measurements();view.click('Undo');assert.equal(view.design.layers.length,0);view.unmount();
});

test('fitting cannot shrink a numeric layer below the existing saved-draft minimum',()=>{
  const view=studio();view.click('+ Add text');const original=JSON.stringify(view.design);
  view.measurements({width:.1,height:360,rotation:45});assert.equal(JSON.stringify(view.design),original);assert.match(view.message,/smaller than 0.1 mm/);
  view.click('Undo');assert.equal(view.design.layers.length,0);view.unmount();
});

test('measurement fitting keeps the rotated artwork inside the safe area and displays the fitted values',()=>{
  const view=studio();view.click('+ Add text');view.measurements({x:0,y:0,width:280,height:360,rotation:45});
  const layer=view.design.layers[0],side=(layer.width+layer.height)/Math.SQRT2;
  assert.ok(layer.x-side/2>=5-.000001);assert.ok(layer.y-side/2>=5-.000001);assert.ok(layer.x+side/2<=275+.000001);assert.ok(layer.y+side/2<=355+.000001);
  for(const field of view.measurementFields)assert.equal(field.defaultValue,layer[field.name]);view.unmount();
});

test('mug and flat-card measurements use their own zone limits without changing other layers',()=>{
  for(const product of ['ceramic-mug','business-card']){
    const view=studio();view.change('Product model',product);view.click('+ Add text');view.click('Duplicate layer');
    const untouched=JSON.stringify(view.design.layers[0]);view.measurements({width:20.25,height:10.5,rotation:30});
    assert.equal(JSON.stringify(view.design.layers[0]),untouched);assert.equal(view.design.layers[1].width,20.25);assert.equal(view.design.layers[1].height,10.5);
    assert.equal(view.measurementFields.find(f=>f.name==='width').max,product==='ceramic-mug'?200:96);view.unmount();
  }
});

test('changed measurements cancel a pending reference; invalid and unchanged entries keep it current',async()=>{
  for(const kind of ['changed','invalid','unchanged']){
    const held=deferred(),view=studio({paint:()=>held.promise});view.click('+ Add text');const pending=view.click('Generate layout reference');
    view.measurements(kind==='changed'?{width:80.5}:kind==='invalid'?{width:''}:{});
    assert.equal(view.busy,kind!=='changed');held.resolve();await pending;await settle();view.render();assert.equal(view.downloads.length,kind==='changed'?0:1);view.unmount();
  }
});

test('reopening a same-product device draft invalidates an already decoding artwork file',async()=>{
  const job=deferred(),view=studio({prepare:()=>job.promise});view.click('Save on device');view.click('+ Add text');pick(view);
  view.click('Reopen draft');job.resolve(artwork);await settle();view.render();
  assert.equal(view.design.layers.length,0);assert.match(view.message,/Saved draft reopened/);assert.equal(view.busy,false);view.unmount();
});

test('artwork completion cannot bypass the twelve-layer limit after intervening text edits',async()=>{
  const job=deferred(),view=studio({prepare:()=>job.promise});for(let i=0;i<11;i++)view.click('+ Add text');pick(view);view.click('+ Add text');
  job.resolve(artwork);await settle();view.render();assert.equal(view.design.layers.length,12);assert.ok(view.design.layers.every(l=>l.kind==='text'));
  assert.match(view.message,/twelve layers/);assert.doesNotMatch(view.message,/decoded and re-encoded/);assert.equal(view.busy,false);view.unmount();
});

test('cancelling artwork leaves current work intact; old completion cannot finish a newer job',async()=>{
  for(const oldFails of [false,true]){
    const first=deferred(),second=deferred();let calls=0;
    const view=studio({prepare:()=>++calls===1?first.promise:second.promise});pick(view);assert.equal(view.busy,true);
    view.click('Cancel preparation');assert.equal(view.busy,false);assert.match(view.message,/current design is unchanged/);pick(view);
    oldFails?first.reject(new Error('synthetic decoder failure')):first.resolve(artwork);await settle();view.render();
    assert.equal(view.busy,true);assert.equal(view.design.layers.length,0);assert.match(view.message,/Preparing artwork locally/);
    second.resolve(artwork);await settle();view.render();assert.equal(view.busy,false);assert.equal(view.design.layers.length,1);view.unmount();
  }
});

test('one synchronous preparation gate suppresses duplicate and overlapping file work',async()=>{
  const job=deferred(),view=studio({prepare:()=>job.promise});pick(view);pick(view);
  let read=false;view.file('application/json,.json',{size:20,text:async()=>{read=true;return '{}';}});
  await view.click('Preparing…');assert.equal(view.decodeCalls,1);assert.equal(read,false);assert.equal(view.downloads.length,0);
  job.resolve(artwork);await settle();view.render();assert.equal(view.design.layers.length,1);assert.equal(view.busy,false);view.unmount();
});

test('a design-size rejection preserves history without claiming artwork success',async()=>{
  // Decoder timing/output are simulated here; image format validation has its own tests.
  const large={...artwork,data:'data:image/png;base64,'+'A'.repeat(2_050_000)};
  const view=studio({prepare:async()=>large});
  for(let i=0;i<2;i++){pick(view);await settle();view.render();}
  assert.equal(view.design.layers.length,2);const previous=JSON.stringify(view.design);
  pick(view);await settle();view.render();assert.equal(JSON.stringify(view.design),previous);assert.match(view.message,/6 MB local limit/);assert.doesNotMatch(view.message,/decoded and re-encoded/);
  view.click('Undo');assert.equal(view.design.layers.length,1);view.unmount();
});

test('product changes, undo, redo and unmount invalidate pending decoder results',async()=>{
  for(const action of ['product','undo','redo','unmount']){
    const job=deferred(),view=studio({prepare:()=>job.promise});view.click('+ Add text');if(action==='redo')view.click('Undo');pick(view);
    if(action==='product')view.change('Product model','ceramic-mug');else if(action==='unmount')view.unmount();else view.click(action==='undo'?'Undo':'Redo');
    const snapshot=JSON.stringify(view.design);job.resolve(artwork);await settle();view.render();assert.equal(JSON.stringify(view.design),snapshot);assert.equal(view.downloads.length,0);
    if(action!=='unmount'){assert.equal(view.busy,false);view.unmount();}
  }
});

test('a missing or invalid saved draft preserves the current design and its pending artwork',async()=>{
  for(const invalid of [false,true]){
    const job=deferred(),view=studio({prepare:()=>job.promise});view.click('+ Add text');if(invalid)view.saved.set('virtual-ink:product-studio:v1','{"role":"SUPER_ADMIN"}');
    pick(view);view.click('Reopen draft');assert.equal(view.design.layers.length,1);assert.equal(view.busy,true);
    job.resolve(artwork);await settle();view.render();assert.equal(view.design.layers.length,2);assert.equal(view.busy,false);view.unmount();
  }
});

test('editing or reopening a device draft cancels a pending JSON replacement without losing newer changes',async()=>{
  for(const action of ['edit','device']){
    const job=deferred(),view=studio();view.click('Save on device');const incoming=JSON.stringify({...view.design,notes:'incoming older draft'});
    view.file('application/json,.json',{size:incoming.length,text:()=>job.promise});
    if(action==='edit')view.change('Customer notes','keep my latest notes');else view.click('Reopen draft');
    const snapshot=JSON.stringify(view.design);job.resolve(incoming);await settle();view.render();assert.equal(JSON.stringify(view.design),snapshot);assert.equal(view.busy,false);
    assert.notEqual(view.design.notes,'incoming older draft');view.unmount();
  }
});

test('valid JSON reopens locally; invalid and oversized files preserve the current design with actionable errors',async()=>{
  for(const kind of ['valid','invalid','oversized']){
    const view=studio();const initial=JSON.stringify(view.design),incoming=JSON.stringify({...view.design,notes:'restored locally'});
    view.file('application/json,.json',{size:kind==='oversized'?6_000_001:incoming.length,text:async()=>kind==='invalid'?'not JSON':incoming});await settle();view.render();
    if(kind==='valid'){assert.equal(view.design.notes,'restored locally');assert.match(view.message,/No file was uploaded/);}
    else {assert.equal(JSON.stringify(view.design),initial);assert.match(view.message,/valid studio design JSON/);}
    assert.equal(view.busy,false);view.unmount();
  }
});

test('cancelled or abandoned reference generation downloads nothing and releases its temporary canvas',async()=>{
  for(const action of ['cancel','edit','device','unmount']){
    const job=deferred(),view=studio({paint:()=>job.promise});view.click('Save on device');const pending=view.click('Generate layout reference');
    if(action==='cancel')view.click('Cancel preparation');else if(action==='edit')view.change('Customer notes','updated during painting');else if(action==='device')view.click('Reopen draft');else view.unmount();
    job.resolve();await pending;await settle();view.render();assert.equal(view.downloads.length,0);assert.equal(view.canvases.length,1);assert.equal(view.canvases[0].width,0);assert.equal(view.canvases[0].height,0);
    if(action!=='unmount'){assert.equal(view.busy,false);view.unmount();}
  }
});

test('an old reference failure does not overwrite a new preparation or clear its busy state',async()=>{
  const old=deferred(),next=deferred();let count=0;const view=studio({paint:()=>++count===1?old.promise:next.promise});
  const first=view.click('Generate layout reference');view.click('Cancel preparation');const second=view.click('Generate layout reference');
  old.reject(new Error('synthetic stale paint failure'));await first;await settle();view.render();assert.equal(view.busy,true);assert.match(view.message,/Preparing layout reference/);
  next.resolve();await second;await settle();view.render();assert.equal(view.busy,false);assert.equal(view.downloads.length,1);view.unmount();
});

test('reference export captures both surfaces and the saved configuration; cancelled attempts do not advance versions',async()=>{
  const hold=deferred();let count=0;const painted=[];const view=studio({paint:async(canvas,product,design,surface)=>{painted.push({design:JSON.stringify(design),surface});if(++count===1)await hold.promise;}});
  const cancelled=view.click('Generate layout reference');view.click('Cancel preparation');hold.resolve();await cancelled;await settle();view.render();
  view.click('+ Add text');view.change('Customer notes','review this configuration');const snapshot=JSON.stringify(view.design);
  await view.click('Generate layout reference');await settle();view.render();const output=JSON.parse(await view.downloads[0].blob.text());
  assert.equal(output.proofVersion,1);assert.equal(output.approvalStatus,'awaiting_vendor');assert.equal(output.orderNumber,null);assert.equal(JSON.stringify(output.configuration),snapshot);
  assert.deepEqual(output.views.map(v=>v.surface),['front','back']);assert.ok(painted.slice(-2).every(v=>v.design===snapshot));assert.ok(view.canvases.every(c=>c.width===0&&c.height===0));
  await view.click('Generate layout reference');await settle();view.render();assert.equal(JSON.parse(await view.downloads[1].blob.text()).proofVersion,1);
  view.change('Customer notes','revised configuration');await view.click('Generate layout reference');await settle();view.render();assert.equal(JSON.parse(await view.downloads[2].blob.text()).proofVersion,2);view.unmount();
});

test('current decoder and painter failures keep the design and clear busy with fixed non-sensitive messages',async()=>{
  const art=studio({prepare:async()=>{throw new Error('UNTRUSTED private decoder details');}});pick(art);await settle();art.render();assert.equal(art.design.layers.length,0);assert.equal(art.busy,false);assert.match(art.message,/Could not open artwork/);assert.doesNotMatch(art.message,/UNTRUSTED/);art.unmount();
  const proof=studio({paint:async()=>{throw new Error('UNTRUSTED private paint details');}});await proof.click('Generate layout reference');await settle();proof.render();assert.equal(proof.busy,false);assert.match(proof.message,/Could not generate/);assert.doesNotMatch(proof.message,/UNTRUSTED/);assert.equal(proof.downloads.length,0);assert.equal(proof.canvases[0].width,0);proof.unmount();
});
