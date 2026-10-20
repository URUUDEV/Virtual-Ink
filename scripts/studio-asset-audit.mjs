/** Offline conformance of reviewed public GLBs; no GPU, supplier or hosted acceptance. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {productModels} from '../src/shared/product-models.ts';

// Install the documented pinned tool separately; never fetch dependencies or model resources here.
const tools=resolve(process.argv[2]||'.private/studio-asset-tools');
const validator=createRequire(resolve(tools,'package.json'))('gltf-validator');
assert.equal(validator.version(),'2.0.0-dev.3.10','Use the reviewed validator version.');
async function validate(bytes){
  let externalRequests=0;
  const report=await validator.validateBytes(new Uint8Array(bytes),{
    maxIssues:0,
    externalResourceFunction:async()=>{externalRequests++;throw new Error('External asset resources are forbidden.');}
  });
  return {report,externalRequests};
}
function bindings(doc,p){
  assert.equal(doc.buffers.length,1);assert.equal(doc.buffers[0].uri,undefined);
  assert.equal(doc.images,undefined);assert.equal(doc.extensionsUsed,undefined);
  assert.equal(doc.extras.productionVerified,false);assert.equal(doc.extras.modelVersion,p.modelVersion);
  const surfaces=new Set();
  for(const mesh of doc.meshes)for(const primitive of mesh.primitives){
    const name=doc.materials[primitive.material].name;
    surfaces.add(name);
    if(p.zones.some(zone=>zone.surface===name))assert.ok(Number.isInteger(primitive.attributes.TEXCOORD_0),'Printable surfaces require UVs.');
  }
  for(const zone of p.zones)assert.ok(surfaces.has(zone.surface),`${p.id}: missing printable surface ${zone.surface}`);
  return [...surfaces];
}

const rows=[];
let fixture;
for(const p of productModels){
  if(!p.modelUrl){assert.equal(p.previewType,'flat-2d');continue;}
  assert.match(p.modelUrl,/^\/models\/studio-v1\/[a-z-]+\.glb$/);
  const bytes=await readFile(new URL(`../apps/web/public${p.modelUrl}`,import.meta.url));
  assert.ok(bytes.length<500_000,'Reviewed demonstration asset size bound.');
  const {report,externalRequests}=await validate(bytes);
  assert.equal(report.issues.numErrors,0,`${p.id}: conformance errors`);
  assert.equal(report.issues.numWarnings,0,`${p.id}: conformance warnings`);
  assert.equal(report.issues.truncated,false);assert.equal(externalRequests,0);
  const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  const codes={};for(const issue of report.issues.messages)codes[issue.code]=(codes[issue.code]??0)+1;
  rows.push({id:p.id,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),
    errors:report.issues.numErrors,warnings:report.issues.numWarnings,infos:report.issues.numInfos,
    hints:report.issues.numHints,externalRequests,codes,surfaces:bindings(doc,p)});
  fixture??={bytes,doc,p};
}
assert.equal(rows.length,9,'Review a catalogue-size change explicitly.');

// In-memory corruption proves this audit rejects defects without altering the supplied files.
assert.ok(fixture);
const truncated=await validate(fixture.bytes.subarray(0,fixture.bytes.length-4));
assert.ok(truncated.report.issues.numErrors>0);assert.equal(truncated.externalRequests,0);
const nonfinite=Buffer.from(fixture.bytes),accessor=fixture.doc.accessors[fixture.doc.meshes[0].primitives[0].attributes.POSITION];
const view=fixture.doc.bufferViews[accessor.bufferView];
nonfinite.writeFloatLE(NaN,28+nonfinite.readUInt32LE(12)+(view.byteOffset??0)+(accessor.byteOffset??0));
const invalidFloat=await validate(nonfinite);
assert.ok(invalidFloat.report.issues.messages.some(issue=>issue.code==='ACCESSOR_INVALID_FLOAT'));
const externalDoc=structuredClone(fixture.doc);
externalDoc.buffers[0].uri='https://example.invalid/synthetic-model-buffer.bin';
const external=await validate(Buffer.from(JSON.stringify(externalDoc)));
assert.equal(external.externalRequests,1);assert.ok(external.report.issues.numErrors>0);
const missingSurface=structuredClone(fixture.doc);
missingSurface.materials.find(material=>material.name===fixture.p.zones[0].surface).name='synthetic-missing-surface';
assert.throws(()=>bindings(missingSurface,fixture.p),/missing printable surface/);

console.log(JSON.stringify({check:'studio_asset_conformance',validatorVersion:validator.version(),
  models:rows.length,flatOnlyProducts:productModels.length-rows.length,
  negativeChecks:['truncated GLB','non-finite position','external buffer denied','missing printable surface'],
  errors:0,warnings:0,infos:rows.reduce((sum,row)=>sum+row.infos,0),
  externalRequests:0,rows,hostedAcceptance:false,physicalDeviceAcceptance:false},null,2));
