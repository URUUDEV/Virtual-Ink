// Static publication for the approved UI-only profile. Full service source and
// runtime gates remain intact; the deployment emits no request-time functions.
import { cp, mkdir, writeFile, readdir, lstat, realpath, rm, symlink } from 'node:fs/promises';
import { resolve, relative, join, dirname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { assertEnvironmentIsolation, disabledIntegrations, protectedProduction } from '../src/backend/setup/environment-isolation.ts';
import { sensitiveRuntimeApproved } from '../src/backend/setup/runtime-policy.ts';

export const closedPages = ['account','admin','auth','brand-lab','customer','vendor','reset-password'];
const serviceFlags = ['WEB_AUTH_ENABLED','AUTH_ENABLED','SECURITY_ADMIN_ENABLED','WORKFLOW_ENABLED','STORAGE_ENABLED','JOBS_ENABLED'];
export function assertPublicUiEnvironment(env = process.env) {
  assertEnvironmentIsolation(env);
  if (!sensitiveRuntimeApproved() || !['local','test','production'].includes(env.APPLICATION_ENVIRONMENT)) throw Error('PUBLIC_UI_BUILD_RUNTIME_REQUIRED');
  if (env.APPLICATION_ENVIRONMENT === 'production' && env.VERCEL_PROJECT_ID !== protectedProduction.vercelProject) throw Error('PUBLIC_UI_PROJECT_MISMATCH');
  if (serviceFlags.some(key => env[key] !== 'false') || env.EMAIL_MODE !== 'disabled' || disabledIntegrations.some(name => env[`${name}_MODE`] !== 'disabled')) throw Error('PUBLIC_UI_SERVICES_MUST_BE_DISABLED');
}
export function publicUiRoutes(securityHeaders) {
  const noStore = { 'Cache-Control':'private, no-store, max-age=0', 'Content-Type':'application/json; charset=utf-8' };
  return [
    { src:'^/.*$', headers:{ ...securityHeaders,'X-Virtual-Ink-Mode':'public-ui-only' }, continue:true },
    { src:'^/(account|admin|brand-lab|customer|vendor|reset-password)(/.*)?$', status:307, headers:{ Location:'/login','Cache-Control':'private, no-store, max-age=0' } },
    { src:'^/auth/.*$', status:303, headers:{ Location:'/login?confirmation=failed','Cache-Control':'private, no-store, max-age=0' } },
    { src:'^/api/workflow(/.*)?$', status:404, dest:'/__ui/not-found.json', headers:noStore },
    { src:'^/(api(/.*)?|health)$', status:503, dest:'/__ui/service-unavailable.json', headers:noStore },
    { src:'^/.*$', methods:['POST','PUT','PATCH','DELETE','OPTIONS'], status:405, dest:'/__ui/method-not-allowed.json', headers:{ ...noStore,Allow:'GET, HEAD' } },
    { src:'^/$', dest:'/index.html' },
    { handle:'filesystem' },
    { src:'^/.*$', status:404, dest:'/404.html' },
  ];
}
export function mayExportSource(path) {
  const key=path.replaceAll('\\','/');
  return !['src/proxy.ts','src/instrumentation.ts',...closedPages.map(page=>`src/app/${page}`),'src/app/api','src/app/health'].some(blocked=>key===blocked||key.startsWith(`${blocked}/`))&&!/^src\/app\/.+\/route\.[jt]s$/.test(key);
}
export async function auditPublicOutput(folder) {
  const files=[];
  async function walk(path) {
    for(const entry of await readdir(path,{withFileTypes:true})) {
      const full=join(path,entry.name),key=relative(folder,full).split(sep).join('/');
      if(entry.isSymbolicLink())throw Error('PUBLIC_UI_SYMLINK_FORBIDDEN');
      if(entry.isDirectory())await walk(full);
      else {
        const parts=key.split('/');
        if(parts.some(part=>part==='.env'||part.startsWith('.env.')||['node_modules','.private','.git','.next','functions','api','health',...closedPages].includes(part))||key.startsWith('_next/server/')||[...closedPages,'health'].some(page=>key===`${page}.html`||key===`${page}.txt`)||/\.(?:[cm]?ts|tsx|docx|sql)$/.test(key))throw Error('PUBLIC_UI_PRIVATE_FILE_FORBIDDEN');
        files.push(key);
      }
    }
  }
  await walk(folder);
  for(const required of ['index.html','shop.html','studio.html','print-documents.html','login.html','register.html','404.html'])if(!files.includes(required))throw Error('PUBLIC_UI_ROUTE_MISSING');
  return files;
}
async function clearOwnedOutput(root, output) {
  await mkdir(dirname(output),{recursive:true});
  const actualRoot=await realpath(root),parent=await realpath(dirname(output));
  if(relative(actualRoot,parent)!=='.vercel'||resolve(output)!==join(root,'.vercel','output'))throw Error('PUBLIC_UI_OUTPUT_PATH_INVALID');
  const existing=await lstat(output).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
  if(existing?.isSymbolicLink())throw Error('PUBLIC_UI_OUTPUT_SYMLINK');
  if(existing){if(relative(actualRoot,await realpath(output)).split(sep).join('/')!=='.vercel/output')throw Error('PUBLIC_UI_OUTPUT_PATH_INVALID');await rm(output,{recursive:true});}
}
export async function buildPublicUi() {
  assertPublicUiEnvironment();
  const root=resolve(fileURLToPath(new URL('../',import.meta.url))),app=join(root,'apps/web');
  const stage=join(root,'.private',`public-ui-export-${randomUUID()}`),stageApp=join(stage,'apps/web');
  await mkdir(stageApp,{recursive:true});
  if(!relative(await realpath(root),await realpath(stage)).split(sep).join('/').startsWith('.private/public-ui-export-'))throw Error('PUBLIC_UI_STAGE_PATH_INVALID');
  const rejectLinks=async path=>{if((await lstat(path)).isSymbolicLink())throw Error('PUBLIC_UI_SOURCE_SYMLINK_FORBIDDEN');return true;};
  await cp(join(root,'src'),join(stage,'src'),{recursive:true,filter:rejectLinks});
  await cp(join(root,'package.json'),join(stage,'package.json'));
  await cp(join(app,'src'),join(stageApp,'src'),{recursive:true,filter:async path=>(await rejectLinks(path))&&mayExportSource(relative(app,path))});
  await cp(join(app,'public'),join(stageApp,'public'),{recursive:true,filter:rejectLinks});
  for(const name of ['package.json','tsconfig.json','postcss.config.mjs'])await cp(join(app,name),join(stageApp,name));
  const linkType=process.platform==='win32'?'junction':'dir';
  await symlink(join(root,'node_modules'),join(stage,'node_modules'),linkType);
  await symlink(join(app,'node_modules'),join(stageApp,'node_modules'),linkType);
  // Server query adapters remain unchanged in the full-service source. The
  // static copy prerenders their empty state; the catalogue client reads its URL.
  const adapters=join(stageApp,'src/components/public-export');
  await mkdir(adapters,{recursive:true});
  for(const name of ['shop','login','register','forgot-password']) {
    await cp(join(app,`src/app/${name}/page.tsx`),join(adapters,`${name}-page.tsx`));
    const argumentsText=['shop','login'].includes(name)?'{searchParams:Promise.resolve({})}':'';
    await writeFile(join(stageApp,`src/app/${name}/page.tsx`),`import Page from '@/components/public-export/${name}-page';\nexport {metadata} from '@/components/public-export/${name}-page';\nexport default function StaticPage(){return Page(${argumentsText});}\n`);
  }
  const configUrl=pathToFileURL(join(app,'next.config.ts')).href;
  const base=(await import(configUrl)).default;
  const headerRules=await base.headers();
  const securityHeaders=Object.fromEntries(headerRules.flatMap(rule=>rule.headers.map(header=>[header.key,header.value])));
  await writeFile(join(stageApp,'next.config.mjs'),`import base from ${JSON.stringify(configUrl)};\nexport default {...base,output:'export',outputFileTracingRoot:${JSON.stringify(stage)},headers:undefined,redirects:undefined,rewrites:undefined,images:{...base.images,unoptimized:true}};\n`);
  const built=spawnSync(process.execPath,[join(app,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:stageApp,env:{...process.env,CIRCLE_NODE_TOTAL:'1'},stdio:'inherit',windowsHide:true});
  if(built.error||built.status!==0)throw Error('PUBLIC_UI_EXPORT_FAILED');
  const files=await auditPublicOutput(join(stageApp,'out'));
  const output=join(root,'.vercel/output');
  await clearOwnedOutput(root,output);
  await cp(join(stageApp,'out'),join(output,'static'),{recursive:true});
  await mkdir(join(output,'static/__ui'),{recursive:true});
  for(const [name,code,message]of [['service-unavailable','IDENTITY_UNAVAILABLE','Server services are disabled for this UI-only release.'],['not-found','NOT_FOUND','This service is not available.'],['method-not-allowed','METHOD_NOT_ALLOWED','Only public page reads are available.']])await writeFile(join(output,`static/__ui/${name}.json`),JSON.stringify({error:{code,message},mode:'public-ui-only'}));
  const overrides={};
  for(const file of files) {
    if(file.endsWith('.html'))overrides[file]={...(!['index.html','404.html'].includes(file)?{path:file.slice(0,-5)}:{}),contentType:'text/html; charset=utf-8'};
    else if(file.endsWith('.txt'))overrides[file]={contentType:'text/x-component; charset=utf-8'};
  }
  await writeFile(join(output,'config.json'),JSON.stringify({version:3,routes:publicUiRoutes(securityHeaders),overrides},null,2)+'\n');
  if((await readdir(output)).some(name=>!['static','config.json'].includes(name)))throw Error('PUBLIC_UI_RUNTIME_OUTPUT_FORBIDDEN');
  console.log(JSON.stringify({check:'public_ui_static_export',status:'pass',files:files.length,functions:0,sourceRoutesPreserved:true,backend:'disabled; not readiness evidence'}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildPublicUi();
