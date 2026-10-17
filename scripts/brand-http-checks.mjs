/** Local route and gate regression. No hosted or authenticated acceptance implied. */
import assert from 'node:assert/strict';
const origin=process.env.WEB_CHECK_URL||'http://127.0.0.1:3117',base=new URL(origin);
assert.ok(base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname)&&base.origin===origin&&!base.username&&!base.password);
let assertions=0;
for(const path of ['/','/marketplace','/pricing','/delivery','/about','/support','/shop','/design-services','/business','/how-it-works','/vendors/join','/studio']){
 const response=await fetch(`${origin}${path}`,{redirect:'manual'}),html=await response.text();assert.equal(response.status,200);assertions++;
 assert.ok(html.includes('<h1')&&html.includes('noindex'));assertions++;
 assert.ok(!html.includes('Replay six-second')&&!html.includes('Rotation speed')&&!html.includes('href="/brand-lab"'));assertions++;
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');assertions++;
}
for(const path of ['/brand-lab','/brand-lab?role=SUPER_ADMIN','/brand-lab?_rsc=synthetic','/brand-lab/'])for(const method of ['GET','HEAD']){
 const response=await fetch(`${origin}${path}`,{method,redirect:'manual',headers:{RSC:'1','Next-Router-Prefetch':'1'}});
 assert.ok([307,308,404].includes(response.status));assertions++;
 if(response.status===307){assert.ok(response.headers.get('cache-control')?.includes('no-store'));assertions++;assert.equal(new URL(response.headers.get('location'),origin).pathname,'/login');assertions++;}
 assert.ok(!(await response.text()).includes('Replay six-second'));assertions++;
}
for(const name of ['vi-icon','vi-logo','vi-logo-dark']){const response=await fetch(`${origin}/brand/${name}.svg`);assert.equal(response.status,200);assertions++;assert.match(await response.text(),/<svg[^>]+xmlns=/);assertions++;}
console.log(JSON.stringify({check:'brand_loopback_http',assertions,status:'pass',hostedAcceptance:false}));
