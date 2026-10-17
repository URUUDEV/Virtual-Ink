import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getProductModel,productModels,publicationIssues,type ProductModel } from '../src/shared/product-models.ts';
import { artworkWarnings,fitLayer,layerBounds,newStudioDesign,parseStudioDraft,reviseProof,type StudioLayer,type StudioDesign } from '../src/shared/studio-design.ts';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQp8AAAAASUVORK5CYII=';
const product=getProductModel('crew-unisex'),zone=product.zones[0];
const layer:StudioLayer={id:'text-1',zoneId:'front',kind:'text',text:'LOCAL\nINK',font:'Poppins',colour:'#123456',x:140,y:180,width:100,height:50,rotation:0,image:null,pixelWidth:0,pixelHeight:0};
const design:StudioDesign={...newStudioDesign(product.id),layers:[layer]};
const parse=(value:unknown)=>parseStudioDraft(JSON.stringify(value));
test('each registered blank is a draft; current commercial evidence is mandatory before publishing',()=>{
  for(const p of productModels){assert.ok(publicationIssues(p).length>=4);assert.equal(newStudioDesign(p.id).productId,p.id);}
  assert.throws(()=>getProductModel('__proto__'));
  const reviewed:ProductModel={...product,demo:false,verification:'verified',vendorId:'fixture-vendor',supplierReference:'fixture-supplier',supplyVerified:true,brand:'Fixture Brand',brandAuthorized:true,measurementsVerified:true,assetsVerified:true,assetLicence:{status:'licensed',reference:'synthetic-only'},lastVerificationDate:'2026-10-17',stockStatus:'in_stock',priceZmw:100,leadTimeDays:4};
  assert.deepEqual(publicationIssues(reviewed),[]);
  assert.equal(publicationIssues({...reviewed,brandAuthorized:false}).length,1);
  for(const incomplete of [{...reviewed,frontThumbnail:''},{...reviewed,backThumbnail:''},{...reviewed,fallbackImages:[]},{...reviewed,modelUrl:null}])assert.equal(publicationIssues(incomplete).length,1);
  assert.deepEqual(publicationIssues({...reviewed,previewType:'flat-2d',modelUrl:null}),[]);
});
test('rotated bounds fit entirely inside the safe zone; interior restricted areas reject',()=>{
  assert.deepEqual(layerBounds(layer),{x:90,y:155,width:100,height:50});
  for(const rotation of [-180,-90,-45,0,45,90,180])for(const x of [-200,140,1000]){
    const fitted=fitLayer({...layer,x,y:1000,width:500,height:500,rotation},zone),b=layerBounds(fitted);
    assert.ok(b.x>=zone.safeInsetMm-.000001);assert.ok(b.y>=zone.safeInsetMm-.000001);
    assert.ok(b.x+b.width<=zone.widthMm-zone.safeInsetMm+.000001);assert.ok(b.y+b.height<=zone.heightMm-zone.safeInsetMm+.000001);
  }
  assert.throws(()=>fitLayer(layer,{...zone,restricted:[{x:100,y:100,width:100,height:100}]}));
});
test('drafts preserve independent front/back artwork, colour and reference size without adding authority',()=>{
  const back={...layer,id:'back-1',zoneId:'back',text:'BACK ONLY'};
  const image={...layer,id:'image-1',kind:'image' as const,text:'',image:`data:image/png;base64,${png}`,pixelWidth:1,pixelHeight:1};
  const saved={...design,layers:[layer,back,image]};
  assert.deepEqual(parse(saved),saved);
  assert.deepEqual(parse({...saved,colour:product.colours[1].hex}).layers,saved.layers);
  assert.equal(parse({...saved,size:'Reference sample'}).size,'Reference sample');
  assert.deepEqual(parse({...design,layers:[]}).layers,[]);
});
test('untrusted draft input rejects unknown fields, stale models, invalid options and oversized files',()=>{
  for(const d of [null,[],{}, {...design,version:2},{...design,price:1},{...design,productId:'other'},{...design,productId:5},{...design,modelVersion:'old'},{...design,colour:'url(x)'},{...design,size:'XL'},{...design,quantity:0},{...design,quantity:1001},{...design,quantity:1.5},{...design,method:'laser'},{...design,notes:'x'.repeat(1001)},{...design,notes:'\u0000'},{...design,layers:null},{...design,layers:Array(13).fill(layer)}])assert.throws(()=>parse(d));
  assert.throws(()=>parseStudioDraft(' '.repeat(6_000_001)));assert.throws(()=>parseStudioDraft('{'));
  assert.throws(()=>parse({...design,size:['Reference sample']}));
  for(const patch of [{kind:['text']},{font:['Poppins']}])assert.throws(()=>parse({...design,layers:[{...layer,...patch}]}));
  for(const patch of [{extra:true},{id:''},{id:'bad id'},{id:5},{zoneId:'missing'},{zoneId:5},{kind:'svg'},{text:'x'.repeat(161)},{text:'a\nb\nc\nd\ne'},{text:'\u0000'},{font:'remote-font'},{colour:'red'},{width:0},{height:1001},{x:-1},{y:Infinity},{rotation:181},{pixelWidth:-1},{pixelHeight:4097},{image:'https://example.invalid/private.png'}])assert.throws(()=>parse({...design,layers:[{...layer,...patch}]}));
  assert.throws(()=>parse({...design,layers:[layer,layer]}));
  assert.throws(()=>parse({...design,layers:[{...layer,x:2}]}));
  assert.throws(()=>parse({...design,layers:[{...layer,kind:'image',image:null}]}));
  for(const patch of [{image:'data:image/svg+xml;base64,PHN2Zy8+'},{image:'data:image/png;base64,bm90LWFuLWltYWdl'},{image:'data:image/png;base64,%%%%'},{image:'x'.repeat(2_796_231)},{pixelWidth:0},{pixelHeight:0},{pixelWidth:2}])assert.throws(()=>parse({...design,layers:[{...layer,kind:'image',image:`data:image/png;base64,${png}`,pixelWidth:1,pixelHeight:1,...patch}]}));
  const bytes=Buffer.from(png,'base64');bytes.writeUInt32BE(1025,16);
  assert.throws(()=>parse({...design,layers:[{...layer,kind:'image',image:`data:image/png;base64,${bytes.toString('base64')}`,pixelWidth:1025,pixelHeight:1}]}));
  assert.throws(()=>parse({...design,method:'screen-print',productId:'ceramic-mug',layers:[{...layer,zoneId:'wrap',x:100,y:30,width:50,height:20}]}));
  assert.throws(()=>parse({...design,layers:[{...layer,width:270.1,height:350.1,x:140,y:180}]}));
});
test('DPI uses actual preview pixels and physical dimensions; low quality and unsafe placement are actionable',()=>{
  const image={...layer,kind:'image' as const,image:`data:image/png;base64,${png}`,pixelWidth:100,pixelHeight:100};
  assert.ok(artworkWarnings({...design,layers:[image]}).some(w=>w.includes('25 DPI')));
  assert.ok(!artworkWarnings({...design,layers:[{...image,pixelWidth:2000,pixelHeight:2000}]}).some(w=>w.includes('DPI')));
  assert.ok(artworkWarnings({...design,layers:[{...layer,zoneId:'missing'}]}).some(w=>w.includes('safe area')));
  assert.ok(artworkWarnings({...design,layers:[{...layer,x:0}]}).some(w=>w.includes('safe area')));
  assert.ok(artworkWarnings({...design,method:'laser'}).some(w=>w.includes('allowed decoration')));
  assert.ok(artworkWarnings({...design,layers:[{...layer,height:1,colour:design.colour}]}).some(w=>w.includes('unreadable')));
  assert.ok(artworkWarnings({...design,layers:[{...layer,colour:design.colour}]}).some(w=>w.includes('contrast')));
  assert.ok(artworkWarnings({...design,method:'embroidery'}).some(w=>w.includes('approximate')));
});
test('any changed configuration creates a new unapproved reference version',()=>{
  const first=reviseProof(null,design);assert.equal(first.version,1);assert.equal(first.status,'awaiting_vendor');
  assert.equal(reviseProof(first,design),first);
  const approved={...first,status:'approved' as const,approvedBy:'synthetic-user',approvedAt:'2026-10-17T00:00:00.000Z'};
  for(const patch of [{notes:'revision'},{quantity:2},{colour:product.colours[1].hex},{layers:[]}]){const next=reviseProof(approved,{...design,...patch});assert.equal(next.version,2);assert.equal(next.status,'awaiting_vendor');assert.equal(next.approvedBy,null);assert.equal(next.approvedAt,null);}
});
test('GLB studies are self contained, bounded, distinct and contain product construction meshes',async()=>{
  const hashes=new Set<string>();
  for(const p of productModels){
    for(const path of p.fallbackImages)assert.match(await readFile(`apps/web/public${path}`,'utf8'),/<svg/);
    if(!p.modelUrl)continue;
    const buffer=await readFile(`apps/web/public${p.modelUrl}`);hashes.add(createHash('sha256').update(buffer).digest('hex'));
    assert.ok(buffer.length<500_000);assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);
    const doc=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
    assert.equal(doc.asset.version,'2.0');assert.equal(doc.extras.productionVerified,false);assert.equal(doc.extras.units,'metres');
    assert.equal(doc.buffers.length,1);assert.equal(doc.buffers[0].uri,undefined);assert.equal(doc.images,undefined);
    const names=doc.meshes.map((m:{name:string})=>m.name);
    if(p.previewType==='garment-3d'){for(const name of ['front-panel','back-panel','left-sleeve','right-sleeve','ribbed-neck-binding','double-stitched-hem'])assert.ok(names.includes(name));}
    if(p.construction==='polo'||p.construction==='corporate'){assert.ok(names.includes('left-collar-leaf'));assert.ok(names.includes('button-1'));}
    if(p.construction==='hoodie')for(const name of ['hood-outer-shell','kangaroo-pocket','drawstring-1'])assert.ok(names.includes(name));
    if(p.construction==='mug')for(const name of ['ceramic-body-rim-interior','ceramic-handle','printable-wrap'])assert.ok(names.includes(name));
    const binaryStart=28+buffer.readUInt32LE(12);
    function values(index:number) {const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];return new Float32Array(buffer.buffer,buffer.byteOffset+binaryStart+v.byteOffset,a.count*(a.type==='VEC2'?2:3));}
    for(const a of doc.accessors){if(a.type==='VEC3')assert.ok(a.min.every(Number.isFinite)&&a.max.every(Number.isFinite));}
    for(const mesh of doc.meshes){const normals=values(mesh.primitives[0].attributes.NORMAL);for(let i=0;i<normals.length;i+=3)assert.ok(Math.abs(Math.hypot(normals[i],normals[i+1],normals[i+2])-1)<.001);}
    if(p.previewType==='garment-3d'){
      const front=values(doc.meshes.find((m:{name:string})=>m.name==='front-panel').primitives[0].attributes.TEXCOORD_0);
      const back=values(doc.meshes.find((m:{name:string})=>m.name==='back-panel').primitives[0].attributes.TEXCOORD_0);
      assert.ok(front[0]<front[80]);assert.ok(back[0]>back[80]);
    }
    if(p.previewType==='vessel-3d'){const uv=values(doc.meshes.find((m:{name:string})=>m.name==='printable-wrap').primitives[0].attributes.TEXCOORD_0);assert.ok(uv[0]>uv[144]);}
  }
  assert.equal(hashes.size,9);
});
