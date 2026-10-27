import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertPublicUiEnvironment,mayExportSource,auditPublicOutput,publicUiRoutes } from '../scripts/build-public-ui.mjs';
const env={APPLICATION_ENVIRONMENT:'test',WEB_AUTH_ENABLED:'false',AUTH_ENABLED:'false',SECURITY_ADMIN_ENABLED:'false',WORKFLOW_ENABLED:'false',STORAGE_ENABLED:'false',JOBS_ENABLED:'false',EMAIL_MODE:'disabled',
  PAYMENTS_MODE:'disabled',MOBILE_MONEY_MODE:'disabled',SMS_MODE:'disabled',WHATSAPP_MODE:'disabled',DELIVERY_MODE:'disabled',BLOCKCHAIN_MODE:'disabled',CANVA_MODE:'disabled',PINTEREST_MODE:'disabled'};
test('public export rejects sensitive enablement and wrong production project',()=>{
  assert.doesNotThrow(()=>assertPublicUiEnvironment(env));
  for(const key of Object.keys(env).filter(key=>key!=='APPLICATION_ENVIRONMENT'))for(const value of [undefined,'true','live'])assert.throws(()=>assertPublicUiEnvironment({...env,[key]:value}));
  assert.throws(()=>assertPublicUiEnvironment({...env,APPLICATION_ENVIRONMENT:'production',VERCEL_PROJECT_ID:'prj_unrelated'}));
});
test('public source filter retains public pages and excludes all server entry paths',()=>{
  for(const path of ['src/app/page.tsx','src/app/vendors/join/page.tsx','src/app/print-documents/page.tsx','src/components/product-studio.tsx'])assert.equal(mayExportSource(path),true);
  for(const path of ['src/app/admin/page.tsx','src/app/account/security/page.tsx','src/app/auth/callback/route.ts','src/app/api/workflow/[action]/route.ts','src/app/health/route.ts','src/app/other/route.js','src/proxy.ts','src/instrumentation.ts'])assert.equal(mayExportSource(path),false);
});
test('static output audit rejects private files and missing public routes',async()=>{
  const folder=await mkdtemp(join(tmpdir(),'virtual-ink-public-export-'));
  await assert.rejects(auditPublicOutput(folder),/PUBLIC_UI_ROUTE_MISSING/);
  for(const name of ['index','shop','studio','print-documents','login','register','404'])await writeFile(join(folder,`${name}.html`),'<h1>Synthetic public page</h1>');
  assert.equal((await auditPublicOutput(folder)).length,7);
  for(const bad of ['api/private.json','.env.production','_next/server/route.js','functions/handler.js','account.html']){
    const unsafe=await mkdtemp(join(tmpdir(),'virtual-ink-public-negative-'));
    for(const name of ['index','shop','studio','print-documents','login','register','404'])await writeFile(join(unsafe,`${name}.html`),'<h1>Synthetic public page</h1>');
    await mkdir(join(unsafe,...bad.split('/').slice(0,-1)),{recursive:true});
    await writeFile(join(unsafe,bad),'{}');
    await assert.rejects(auditPublicOutput(unsafe),/PUBLIC_UI_PRIVATE_FILE_FORBIDDEN/);
  }
});
test('static output audit rejects linked files rather than exporting their targets',async()=>{
  const folder=await mkdtemp(join(tmpdir(),'virtual-ink-public-link-'));
  const target=await mkdtemp(join(tmpdir(),'virtual-ink-private-link-target-'));
  await symlink(target,join(folder,'linked'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(auditPublicOutput(folder),/PUBLIC_UI_SYMLINK_FORBIDDEN/);
});
test('CDN rules close private pages and APIs before static lookup without claiming backend health',()=>{
  const routes=publicUiRoutes({'X-Content-Type-Options':'nosniff'});
  const privateRule=routes.find(route=>route.status===307),apiRule=routes.find(route=>route.status===503);
  for(const path of ['/account','/admin/security','/brand-lab','/vendor/jobs'])assert(new RegExp(privateRule.src).test(path));
  for(const path of ['/vendors/join','/shop/vendor-shirt','/accountant'])assert(!new RegExp(privateRule.src).test(path));
  for(const path of ['/health','/api/v1/health','/api/auth/login'])assert(new RegExp(apiRule.src).test(path));
  assert.equal(privateRule.headers.Location,'/login');assert.equal(apiRule.dest,'/__ui/service-unavailable.json');
  assert(routes.indexOf(apiRule)<routes.findIndex(route=>route.handle==='filesystem'));
  assert(!JSON.stringify(routes).includes('middlewarePath'));
});
