// Synthetic hook/transport checks, not hosted browser or physical-device MFA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
const web=resolve('apps/web/src'),require=createRequire(resolve('apps/web/package.json'));
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const key='A'.repeat(32),factorId='12345678-1234-4123-8123-123456789abc';
const initial={userId:factorId,role:'ADMIN',canManageRoles:false,factors:[],assurance:{currentLevel:'aal1',nextLevel:'aal1'}};
function harness(failure) {
 let clock=1000,timerId=0,current,cursor,effects=[],nodes=[],factorStatus='unverified',removed=false;
 const timers=new Map(),instances=new Map(),calls=[],document=new EventTarget();
 const hooks={...React,useState(value){const owner=current,index=cursor++;if(!owner.values.has(index))owner.values.set(index,typeof value==='function'?value():value);return [owner.values.get(index),next=>owner.values.set(index,typeof next==='function'?next(owner.values.get(index)):next)];},
  useEffect(setup,deps){const owner=current,index=cursor++,previous=owner.effects.get(index);if(!previous||deps.some((value,i)=>!Object.is(value,previous.deps[i])))effects.push(()=>{previous?.cleanup?.();owner.effects.set(index,{deps,cleanup:setup()});});}};
 const context=vm.createContext({console,document,Date:class extends Date{static now(){return clock;}},
  setTimeout(fn,ms){timers.set(++timerId,{fn,due:clock+ms});return timerId;},clearTimeout:id=>timers.delete(id),
  FormData:class{constructor(form){this.fields=form.fields;}get(name){return this.fields[name]??null;}},
  localStorage:new Proxy({},{get(){throw new Error('No browser storage allowed');}}),sessionStorage:new Proxy({},{get(){throw new Error('No browser storage allowed');}}),
  fetch:async(url,options)=>{
   calls.push({url,options});assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.equal(options.credentials,'same-origin');
   if(failure)return failure();
   const action=url.split('/').at(-1);let data={auditId:factorId};
   if(action==='enroll')data={...data,factorId,qr:'data:image/svg+xml;base64,c3ludGhldGlj',manualKey:key};
   if(action==='status')data={...initial,factors:removed?[]:[{id:factorId,type:'totp',status:factorStatus}]};
   if(action==='challenge')data={...data,challengeId:factorId};
   if(action==='verify'){factorStatus='verified';data={...data,state:'verified'};}
   if(action==='cancel-enrollment'){removed=true;data={...data,state:'factor_removed'};}
   return new Response(JSON.stringify({data}),{status:200,headers:{'Content-Type':'application/json'}});
  }});
 const modules=new Map();
 function load(path){
  if(modules.has(path))return modules.get(path).exports;
  const module={exports:{}};modules.set(path,module);
  const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const local=name=>name==='react'?hooks:name==='next/link'?{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)}:
   name.startsWith('.')?load(resolve(dirname(path),`${name}.tsx`)):require(name);
  vm.runInContext(`(function(require,module,exports){${source}\n})`,context,{filename:path})(local,module,module.exports);return module.exports;
 }
 const Component=load(resolve(web,'components/security-admin-panel.tsx')).SecurityAdminPanel;
 const text=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(text).join(''):typeof node==='object'?text(node.props?.children):String(node);
 const active=new Set();
 function expand(node,path='root'){
  if(node==null||typeof node==='boolean')return null;
  if(Array.isArray(node))return node.map((child,index)=>expand(child,`${path}.${index}`));
  if(typeof node!=='object')return node;
  if(typeof node.type==='function'){
   const identity=`${path}:${node.key??''}`;active.add(identity);
   if(!instances.has(identity))instances.set(identity,{values:new Map(),effects:new Map()});
   current=instances.get(identity);cursor=0;return expand(node.type(node.props),`${identity}.render`);
  }
  const children=expand(node.props.children,`${path}.children`);nodes.push({type:node.type,props:{...node.props,children},text:text(children)});
  return React.createElement(node.type,{...node.props,key:path,children});
 }
 function render(){
  nodes=[];effects=[];active.clear();const tree=expand(React.createElement(Component,{initial}));
  for(const [identity,instance] of instances)if(!active.has(identity)){for(const effect of instance.effects.values())effect.cleanup?.();instances.delete(identity);}
  for(const effect of effects)effect();return renderToStaticMarkup(tree);
 }
 function find(type,label){const matches=nodes.filter(node=>node.type===type&&node.text.includes(label));assert.equal(matches.length,1,`${type} ${label}`);return matches[0];}
 return {render,calls,document,timers,find,
  advance(ms,runTimers=true){clock+=ms;if(runTimers)for(const [id,timer] of [...timers])if(timer.due<=clock){timers.delete(id);timer.fn();}},
  async enroll(){render();await find('button','Enroll authenticator').props.onClick();return render();},
  async verify(){await find('button','Start MFA challenge').props.onClick();render();const form={fields:{code:'123456'},reset(){}};
   find('form','Verify authenticator').props.onSubmit({preventDefault(){},currentTarget:form});await new Promise(setImmediate);return render();},
  unmount(){for(const instance of instances.values())for(const effect of instance.effects.values())effect.cleanup?.();instances.clear();}};
}
test('manual MFA setup is labelled, masked by default, explicitly revealable and never posted back',async()=>{
 const view=harness();let html=await view.enroll();
 assert.match(html,/<label for="mfa-manual-key">/);assert.match(html,/type="password"/);assert.match(html,/aria-describedby="mfa-manual-help"/);
 assert.match(html,/aria-pressed="false"/);assert.match(html,/autoComplete="off"/);
 await view.find('button','Show setup key').props.onClick();html=view.render();assert.match(html,/aria-pressed="true"/);
 assert.match(html,new RegExp(`type="text"[^>]*value="${key}"`));
 await view.find('button','Hide setup key').props.onClick();assert.match(view.render(),/aria-pressed="false"/);
 assert.ok(!JSON.stringify(view.calls).includes(key));view.unmount();assert.equal(view.timers.size,0);
});
test('enrollment deadline is absolute across renders and returning from a suspended tab clears details',async()=>{
 for(const throttled of [false,true]){
  const view=harness();await view.enroll();view.advance(240000,false);view.find('button','Show setup key').props.onClick();view.render();
  assert.equal([...view.timers.values()][0].due,301000);
  view.advance(60001,!throttled);if(throttled)view.document.dispatchEvent(new Event('visibilitychange'));
  const html=view.render();assert.ok(!html.includes(key));assert.doesNotMatch(html,/mfa-manual-key|<figure>/);
  assert.ok(!view.calls.some(call=>call.url.includes('cancel-enrollment')));view.unmount();
 }
});
test('verification, explicit hiding and confirmed cancellation remove setup details without persisting secrets',async()=>{
 const verified=harness();await verified.enroll();assert.ok(!(await verified.verify()).includes(key));assert.equal(verified.timers.size,0);verified.unmount();
 const hidden=harness();await hidden.enroll();hidden.find('button','Hide setup details').props.onClick();assert.ok(!hidden.render().includes(key));hidden.unmount();
 const cancelled=harness();await cancelled.enroll();await cancelled.find('button','Discard unfinished enrollment').props.onClick();assert.ok(!cancelled.render().includes(key));cancelled.unmount();
});
test('malformed and failed security responses never reflect diagnostic bodies or create setup details',async()=>{
 for(const response of [()=>new Response('PRIVATE_CANARY_NOT_JSON'),()=>new Response(JSON.stringify({error:{message:key}}),{status:500}),()=>new Response(JSON.stringify({data:{qr:'https://attacker.invalid',manualKey:key}}))]){
  const view=harness(response),html=await view.enroll();assert.doesNotMatch(html,/PRIVATE_CANARY|attacker.invalid|mfa-manual-key/);assert.ok(!html.includes(key));assert.match(html,/role="alert"/);view.unmount();
 }
});
