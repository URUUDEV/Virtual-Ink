/** Reviewed component handlers with synthetic transport/hooks. Not real-browser or hosted Auth acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const sourceRoot=resolve('apps/web/src');
function moduleLoader(overrides={},globals={}) {
  const cache=new Map(),context=vm.createContext({AbortController,Response,console,...globals});
  function load(path){
    if(cache.has(path))return cache.get(path).exports;
    const module={exports:{}};
    const source=readFileSync(path,'utf8');cache.set(path,module);
    const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    function local(name){
      if(Object.hasOwn(overrides,name))return overrides[name];
      const base=name.startsWith('@/')?resolve(sourceRoot,name.slice(2)):name.startsWith('.')?resolve(dirname(path),name):null;
      if(base){if(/\.tsx?$/.test(base))return load(base);try{return load(`${base}.tsx`);}catch(error){if(error.code!=='ENOENT')throw error;return load(`${base}.ts`);}}
      return require(name);
    }
    vm.runInContext(`(function(require,module,exports){${compiled}\n})`,context,{filename:path})(local,module,module.exports);return module.exports;
  }
  return load;
}
const ok=state=>new Response(JSON.stringify({data:{state}}),{status:200,headers:{'Content-Type':'application/json'}});
const failure=status=>new Response(JSON.stringify({error:{message:'UNTRUSTED <script>provider detail</script>'}}),{status});
function form(values){
  const fields={...values},password={value:fields.password??''};
  return {fields,password,resets:0,querySelector:()=>password,reset(){this.resets++;password.value='';},event(){return {preventDefault(){},currentTarget:this};}};
}
function harness(file,name,props,transport) {
  const instances=new Map(),calls=[],navigation=[],focus=[];let current,cursor,effects=[],nodes=[];
  const hooks={...React,
    useState(initial){const slot=cursor++,owner=current;if(!owner.values.has(slot))owner.values.set(slot,typeof initial==='function'?initial():initial);return [owner.values.get(slot),next=>owner.values.set(slot,typeof next==='function'?next(owner.values.get(slot)):next)];},
    useRef(initial){const slot=cursor++;if(!current.values.has(slot))current.values.set(slot,{current:initial});return current.values.get(slot);},
    useEffect(setup,deps){const slot=cursor++,owner=current,previous=owner.effects.get(slot);if(!previous||deps.some((v,i)=>!Object.is(v,previous.deps[i])))effects.push(()=>{previous?.cleanup?.();owner.effects.set(slot,{deps,cleanup:setup()});});}
  };
  const load=moduleLoader({react:hooks,'next/navigation':{useRouter:()=>({replace:path=>navigation.push(path),refresh:()=>navigation.push('refresh')})},
    'next/link':{__esModule:true,default:({children,...rest})=>React.createElement('a',rest,children)}},
    {FormData:class{constructor(target){this.fields={...target.fields};}get(key){return this.fields[key]??null;}},fetch:async(url,options)=>{calls.push({url,options});return transport(url,options);}});
  const Component=load(resolve(sourceRoot,file))[name];
  function expand(node,path='root'){
    if(node==null||typeof node==='boolean')return null;
    if(Array.isArray(node))return node.map((child,index)=>expand(child,`${path}.${index}`));
    if(typeof node!=='object')return node;
    if(typeof node.type==='function'){
      if(!instances.has(path))instances.set(path,{values:new Map(),effects:new Map()});current=instances.get(path);cursor=0;
      return expand(node.type(node.props),`${path}.render`);
    }
    const children=expand(node.props.children,`${path}.children`);
    if(typeof node.type==='string'){
      const text=flatten(children),host={type:node.type,props:{...node.props,children},text};nodes.push(host);
      if(node.props.ref)node.props.ref.current={focus:()=>focus.push(text)};
    }
    return React.createElement(node.type,{...node.props,key:path,children});
  }
  function flatten(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(flatten).join('');return typeof node==='object'?flatten(node.props?.children):String(node);}
  function render(){nodes=[];effects=[];const tree=expand(React.createElement(Component,props));for(const effect of effects)effect();return renderToStaticMarkup(tree);}
  return {render,calls,navigation,focus,load,get nodes(){return nodes;},find(type,text){const matches=nodes.filter(n=>n.type===type&&(text===undefined||n.text.includes(text)));assert.equal(matches.length,1,`${type}: ${text}`);return matches[0];},unmount(){for(const instance of instances.values())for(const effect of instance.effects.values())effect.cleanup?.();}};
}

test('account transport binds fixed same-origin requests and requires the expected server success state',async()=>{
  const requests=[];let response=ok('signed_in');
  const load=moduleLoader({}, {fetch:async(url,options)=>{requests.push({url,options});return response;}}),{accountRequest}=load(resolve(sourceRoot,'lib/account-request.ts'));
  const controller=new AbortController();assert.equal((await accountRequest('login',{email:'synthetic@example.test',password:'synthetic only'},controller.signal)).ok,true);
  const request=requests[0];assert.equal(request.url,'/api/auth/login');assert.equal(request.options.credentials,'same-origin');assert.equal(request.options.cache,'no-store');assert.equal(request.options.redirect,'error');assert.equal(request.options.signal,controller.signal);
  response=ok('confirmation_required');await assert.rejects(accountRequest('login',{},controller.signal),/Unconfirmed/);
  response=new Response('<html>unavailable</html>');await assert.rejects(accountRequest('password-update',{},controller.signal));
  response=failure(429);assert.equal((await accountRequest('register',{},controller.signal)).status,429);
});

test('account SSR has labelled hidden password controls, native constraints and disabled unavailable actions',()=>{
  const load=moduleLoader({'next/navigation':{useRouter:()=>({})}});
  for(const [file,name,props]of [['auth-form.tsx','AuthForm',{action:'login'}],['auth-form.tsx','AuthForm',{action:'register'}],['password-recovery-form.tsx','PasswordRecoveryForm',{mode:'update'}]]){
    const Component=load(resolve(sourceRoot,'components',file))[name];
    const html=renderToStaticMarkup(React.createElement(Component,{...props,available:false}));
    assert.match(html,/type="password"/);assert.match(html,/disabled=""/);assert.match(html,/aria-controls="(?:auth|recovery)-password"/);assert.match(html,/aria-pressed="false"/);assert.match(html,/Account access is being prepared/);
    assert.match(html,/maxLength="128"/);assert.doesNotMatch(html,/localStorage|access_token|refresh_token/);
  }
});

test('show password is keyboard-button compatible, preserves password-manager hints and is masked while busy',()=>{
  const props={id:'test-password',newPassword:true,disabled:false};
  const view=harness('components/account-form-controls.tsx','PasswordField',props,()=>{});
  let html=view.render();assert.match(html,/autoComplete="new-password"/);assert.match(html,/aria-describedby="test-password-help"/);assert.match(html,/minLength="12"/);
  view.find('button','Show').props.onClick();html=view.render();assert.match(html,/type="text"/);assert.match(html,/aria-pressed="true"/);assert.match(html,/Pasting from a password manager/);
  props.disabled=true;html=view.render();assert.match(html,/type="password"/);assert.match(html,/aria-pressed="false"/);view.unmount();
});

test('login failures focus a fixed actionable message, clear the password and never echo provider errors',async()=>{
  for(const [status,expected]of [[400,'Check your email'],[401,'incorrect'],[403,'not allowed'],[429,'Wait before'],[503,'temporarily unavailable']]){
    const view=harness('components/auth-form.tsx','AuthForm',{action:'login',available:true},()=>failure(status));view.render();const input=form({email:'synthetic@example.test',password:'synthetic password only'});
    await view.find('form').props.onSubmit(input.event());const html=view.render();assert.equal(input.password.value,'');assert.ok(html.includes(expected));assert.doesNotMatch(html,/UNTRUSTED|provider detail/);assert.equal(view.navigation.length,0);assert.ok(view.focus.some(message=>message.includes(expected)));view.unmount();
  }
});

test('confirmed login navigates only to the fixed account route; registration retains generic confirmation',async()=>{
  for(const action of ['login','register']){
    const view=harness('components/auth-form.tsx','AuthForm',{action,available:true},()=>ok(action==='login'?'signed_in':'confirmation_required'));view.render();const input=form({email:'synthetic@example.test',password:'synthetic password only'});
    await view.find('form').props.onSubmit(input.event());const html=view.render();
    if(action==='login')assert.deepEqual(view.navigation,['/account','refresh']);else{assert.match(html,/Check your email/);assert.match(html,/If registration can proceed/);assert.doesNotMatch(html,/synthetic@example/);assert.equal(view.navigation.length,0);}
    view.unmount();
  }
});

test('successful password update followed by logout failure locks password submission and retries only logout',async()=>{
  for(const networkFailure of [false,true]){
    let logoutAttempts=0;
    const view=harness('components/password-recovery-form.tsx','PasswordRecoveryForm',{mode:'update',available:true},url=>{
      if(url.endsWith('password-update'))return ok('password_updated');logoutAttempts++;if(logoutAttempts===1){if(networkFailure)throw new Error('offline');return failure(503);}return ok('signed_out');
    });view.render();const input=form({password:'synthetic password only'});
    await view.find('form').props.onSubmit(input.event());let html=view.render();assert.match(html,/Password updated/);assert.doesNotMatch(html,/<form|Save new password/);assert.equal(input.password.value,'');assert.equal(view.navigation.length,0);
    await view.find('button','Finish signing out').props.onClick();view.render();assert.equal(view.calls.filter(call=>call.url.endsWith('password-update')).length,1);assert.equal(logoutAttempts,2);assert.deepEqual(view.navigation,['/login?recovery=complete','refresh']);view.unmount();
  }
});

test('uncertain update outcomes never claim success or resubmit a password',async()=>{
  for(const outcome of ['network','server','malformed']){
    const view=harness('components/password-recovery-form.tsx','PasswordRecoveryForm',{mode:'update',available:true},url=>{
      if(url.endsWith('logout'))return ok('signed_out');if(outcome==='network')throw new Error('offline');return outcome==='server'?failure(503):ok('wrong_state');
    });view.render();await view.find('form').props.onSubmit(form({password:'synthetic password only'}).event());let html=view.render();assert.match(html,/Password update not confirmed/);assert.doesNotMatch(html,/<form|Your new password was saved/);assert.equal(view.calls.length,1);
    await view.find('button','Finish signing out').props.onClick();view.render();assert.deepEqual(view.navigation,['/login?recovery=review','refresh']);assert.equal(view.calls.length,2);view.unmount();
  }
});

test('expired recovery closes the password form; validation, access and rate failures stay actionable',async()=>{
  for(const status of [400,401,403,429]){
    const view=harness('components/password-recovery-form.tsx','PasswordRecoveryForm',{mode:'update',available:true},()=>failure(status));view.render();await view.find('form').props.onSubmit(form({password:'synthetic password only'}).event());const html=view.render();
    if(status===401){assert.doesNotMatch(html,/<form/);assert.match(html,/Request a new recovery link/);}else assert.match(html,/<form/);
    assert.equal(view.calls.length,1);assert.equal(view.navigation.length,0);assert.doesNotMatch(html,/UNTRUSTED|Password updated/);view.unmount();
  }
});

test('reset requests use a non-enumerating confirmation and never claim the email was delivered',async()=>{
  const view=harness('components/password-recovery-form.tsx','PasswordRecoveryForm',{mode:'request',available:true},()=>ok('if_account_exists'));view.render();await view.find('form').props.onSubmit(form({email:'synthetic@example.test'}).event());const html=view.render();assert.match(html,/If an account matches/);assert.doesNotMatch(html,/synthetic@example|arrive shortly/);assert.equal(view.calls[0].url,'/api/auth/password-reset');view.unmount();
});

test('the synchronous gate rejects duplicate work and cleanup aborts without stale navigation or a false success',async()=>{
  let finish;const view=harness('components/auth-form.tsx','AuthForm',{action:'login',available:true},()=>new Promise(resolve=>{finish=resolve;}));view.render();const submit=view.find('form').props.onSubmit;
  const first=submit(form({email:'synthetic@example.test',password:'synthetic only'}).event());await submit(form({email:'synthetic@example.test',password:'synthetic only'}).event());assert.equal(view.calls.length,1);
  view.unmount();assert.equal(view.calls[0].options.signal.aborted,true);finish(ok('signed_in'));await first;assert.equal(view.navigation.length,0);
});

test('disabled account forms and failed logout never fabricate completion',async()=>{
  const disabled=harness('components/auth-form.tsx','AuthForm',{action:'register',available:false},()=>{throw new Error('must not send');});disabled.render();await disabled.find('form').props.onSubmit(form({}).event());assert.equal(disabled.calls.length,0);disabled.unmount();
  const view=harness('components/sign-out.tsx','SignOut',{},()=>failure(503));view.render();await view.find('button','Log out').props.onClick();assert.match(view.render(),/Retry before leaving this browser/);assert.equal(view.navigation.length,0);view.unmount();
});

test('a completed recovery update closes the session before navigation; leaving mid-update never starts new UI work',async()=>{
  const view=harness('components/password-recovery-form.tsx','PasswordRecoveryForm',{mode:'update',available:true},url=>ok(url.endsWith('password-update')?'password_updated':'signed_out'));view.render();
  await view.find('form').props.onSubmit(form({password:'synthetic password only'}).event());assert.deepEqual(view.calls.map(call=>call.url),['/api/auth/password-update','/api/auth/logout']);assert.deepEqual(view.navigation,['/login?recovery=complete','refresh']);view.unmount();
  let finish;const abandoned=harness('components/password-recovery-form.tsx','PasswordRecoveryForm',{mode:'update',available:true},()=>new Promise(resolve=>{finish=resolve;}));abandoned.render();
  const pending=abandoned.find('form').props.onSubmit(form({password:'synthetic password only'}).event());abandoned.unmount();finish(ok('password_updated'));await pending;assert.equal(abandoned.calls.length,1);assert.equal(abandoned.navigation.length,0);
});
