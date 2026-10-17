import assert from 'node:assert/strict';
import { productModels } from '../src/shared/product-models.ts';
const origin = process.env.WEB_CHECK_URL || 'http://127.0.0.1:3117';
const url = new URL(origin);
assert.ok(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname) && url.origin === origin && !url.username && !url.password, 'Use an explicit loopback origin.');
let checks = 0;
const response = await fetch(`${origin}/studio`), html = await response.text();
assert.equal(response.status, 200); checks++;
for(const text of ['A blank. A possibility.', 'Digital preview', 'vendor verification required', 'noindex']){assert.ok(html.includes(text));checks++;}
for(const p of productModels){
  for(const path of p.fallbackImages){const result=await fetch(`${origin}${path}`);assert.equal(result.status,200);assert.match(await result.text(),/<svg/);checks+=2;}
  if(p.modelUrl){const result=await fetch(`${origin}${p.modelUrl}`);assert.equal(result.status,200);const data=new DataView(await result.arrayBuffer());assert.equal(data.getUint32(0,true),0x46546c67);assert.equal(data.getUint32(4,true),2);checks+=3;}
}
console.log(JSON.stringify({check:'studio_loopback_http',checks,status:'pass',hostedAcceptance:false}));
