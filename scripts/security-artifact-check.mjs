// Inspect browser artifacts, not server chunks or secrets. Emit names/counts only.
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=resolve('apps/web/.next/static');
const findings=[];let files=0;
const patterns=[['server_security_configuration',/SECURITY_(?:DATABASE_URL|DATABASE_SSL_ROOT_CERT|CODE_HMAC_KEY)/],
 ['privileged_key',/sb_secret_[A-Za-z0-9_-]{16,}/],['database_url',/postgres(?:ql)?:\/\//],
 ['session_token',/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{16,}/],
 ['enrollment_secret',/otpauth:\/\/totp\/[^\s"']*[?&]secret=/]];
async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
 if(entry.isSymbolicLink())throw new Error('Artifact scan rejects symlinks.');
 const path=resolve(folder,entry.name);
 if(entry.isDirectory())await walk(path);
 else if(/\.(js|json|map|html)$/.test(entry.name)){
  files++;const body=await readFile(path,'utf8');
  for(const [kind,pattern]of patterns)if(pattern.test(body))findings.push({file:relative(root,path).replaceAll('\\','/'),kind});
 }
}}
await mkdir('coverage',{recursive:true});
let status='blocked';
try{await walk(root);status=files>0&&findings.length===0?'pass':'blocked';}
catch{findings.push({kind:'artifacts_unavailable'});}
const report={check:'browser_security_artifacts',date:new Date().toISOString(),status,files,findings,
 limits:['Static browser artifacts only','Not genuine deployed log or provider-secret encryption evidence']};
await writeFile('coverage/security-artifacts.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exitCode=status==='pass'?0:1;
