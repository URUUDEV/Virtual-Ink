'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { productModels,getProductModel,type Method } from '@shared/product-models';
import { artworkWarnings,fitLayer,newStudioDesign,parseStudioDraft,previewNotice,reviseProof,type StudioDesign,type StudioLayer } from '@shared/studio-design';
import { prepareArtwork } from '@/lib/design-canvas';
import { downloadLocal } from '@/lib/local-download';
import { paintLayout } from '@/lib/studio-paint';
import { ProductStudioPreview } from './product-studio-preview';
import './product-studio.css';
const key='virtual-ink:product-studio:v1';
export function ProductStudio() {
  const [design,setDesign]=useState<StudioDesign>(()=>newStudioDesign('crew-unisex'));
  const [past,setPast]=useState<StudioDesign[]>([]),[future,setFuture]=useState<StudioDesign[]>([]);
  const [zoneId,setZoneId]=useState('front'),[selected,setSelected]=useState(''),[message,setMessage]=useState('Your artwork stays in this tab. Device saving is optional.'),[busy,setBusy]=useState(false);
  const generation=useRef(0),latest=useRef(design),proof=useRef<ReturnType<typeof reviseProof>|null>(null);
  const work=useRef<'artwork'|'draft'|'reference'|null>(null);
  const product=getProductModel(design.productId),zone=product.zones.find(z=>z.id===zoneId)??product.zones[0],layer=design.layers.find(l=>l.id===selected);
  const measurements=[['x','Horizontal centre',0,zone.widthMm,'mm'],['y','Vertical centre',0,zone.heightMm,'mm'],['width','Width',.1,zone.widthMm,'mm'],['height','Height',.1,zone.heightMm,'mm'],['rotation','Rotation',-180,180,'degrees']] as const;
  const warnings=artworkWarnings(design);
  useEffect(()=>()=>{generation.current++;work.current=null;latest.current=newStudioDesign('crew-unisex');},[]);
  function cancelWork() {generation.current++;work.current=null;setBusy(false);}
  function beginWork(kind:NonNullable<typeof work.current>) {
    if(work.current)return null;
    const request=++generation.current;work.current=kind;setBusy(true);
    setMessage(kind==='artwork'?'Preparing artwork locally…':kind==='draft'?'Opening design file locally…':'Preparing layout reference…');return request;
  }
  function finishWork(request:number) {if(request===generation.current){work.current=null;setBusy(false);}}
  function commit(next:StudioDesign) {
    if(next.layers.length>12){setMessage('Use up to twelve layers. Remove a layer before adding artwork.');return false;}
    if(JSON.stringify(next).length>6_000_000){setMessage('This design exceeds the 6 MB local limit. Remove an image or use a smaller file.');return false;}
    if(work.current==='reference'||work.current==='draft'){cancelWork();setMessage('Design changed. Preparation cancelled; start it again for the current design.');}
    const previous=latest.current;setPast(p=>[...p,previous].slice(-30));setFuture([]);latest.current=next;setDesign(next);return true;
  }
  function patchLayer(patch:Partial<StudioLayer>) {
    if(!layer)return false;
    try {const updated=fitLayer({...layer,...patch},zone);
      if(updated.width<.1||updated.height<.1){setMessage('Safe-area fitting would make this layer smaller than 0.1 mm. Increase its dimensions or reduce its rotation. Your design is unchanged.');return false;}
      if((Object.keys(updated) as (keyof StudioLayer)[]).every(field=>updated[field]===layer[field]))return true;
      return commit({...design,layers:design.layers.map(l=>l.id===layer.id?updated:l)});}
    catch {setMessage('That placement crosses a restricted area. Move or resize the artwork.');return false;}
  }
  function applyMeasurements(form:HTMLFormElement) {
    const patch:Partial<Record<'x'|'y'|'width'|'height'|'rotation',number>>={};
    for(const [field,title,min,max,unit] of measurements){
      const input=form.elements.namedItem(field) as HTMLInputElement|null,source=input?.value.trim()??'',value=Number(source);
      if(!source||!Number.isFinite(value)||value<min||value>max){setMessage(`Enter ${title.toLowerCase()} between ${min} and ${max} ${unit}. Your design is unchanged.`);return;}
      patch[field]=value;
    }
    const previous=latest.current,cancelsPreparation=work.current==='reference'||work.current==='draft';
    if(patchLayer(patch)){form.reset();if(previous!==latest.current)setMessage(`Measurements applied. The fields show the safe-area fit.${cancelsPreparation?' Pending preparation was cancelled.':''}`);}
  }
  function addText() {
    if(design.layers.length>=12){setMessage('Use up to twelve layers in this local study.');return;}
    const id=crypto.randomUUID();const l:StudioLayer={id,zoneId:zone.id,kind:'text',text:'YOUR IDEA',font:'Poppins',colour:'#293344',x:zone.widthMm/2,y:zone.heightMm/2,width:Math.min(140,zone.widthMm-12),height:Math.min(35,zone.heightMm-12),rotation:0,image:null,pixelWidth:0,pixelHeight:0};
    if(commit({...design,layers:[...design.layers,fitLayer(l,zone)]}))setSelected(id);
  }
  async function artwork(file:File|undefined) {
    if(!file)return;
    if(!['image/png','image/jpeg'].includes(file.type)){setMessage('Use a still PNG or JPEG up to 2 MB. SVG and PDF need a vendor quarantine and preflight workflow before they can be accepted.');return;}
    if(design.layers.length>=12){setMessage('Use up to twelve layers.');return;}
    const request=beginWork('artwork');if(request===null)return;
    const productId=design.productId,target=zone;
    try {const art=await prepareArtwork(file);if(request!==generation.current||latest.current.productId!==productId)return;
      const width=Math.min(target.widthMm-12,140),height=width*art.height/art.width,id=crypto.randomUUID();
      const l:StudioLayer={id,zoneId:target.id,kind:'image',text:'',font:'Poppins',colour:'#293344',x:target.widthMm/2,y:target.heightMm/2,width,height,rotation:0,image:art.data,pixelWidth:art.width,pixelHeight:art.height};
      const current=latest.current;if(commit({...current,layers:[...current.layers,fitLayer(l,target)]})){setSelected(id);setMessage('Artwork decoded and re-encoded locally. Preview is limited to 1024 pixels; the DPI warning uses those actual pixels. Keep your original for vendor preflight.');}
    } catch {if(request===generation.current)setMessage('Could not open artwork. Choose a still PNG or JPEG, at most 2 MB, 4096 pixels per side and 16 megapixels.');}
    finally {finishWork(request);}
  }
  function switchProduct(id:string) {cancelWork();const next=newStudioDesign(id);setZoneId(getProductModel(id).zones[0].id);setSelected('');commit(next);setMessage('A new product configuration is ready. Undo returns to your previous design.');}
  function restore(next:StudioDesign) {cancelWork();latest.current=next;setDesign(next);setZoneId(getProductModel(next.productId).zones[0].id);setSelected('');setMessage('Design history restored. Pending preparation was cancelled.');}
  function undo() {const previous=past.at(-1);if(!previous)return;setPast(past.slice(0,-1));setFuture([design,...future]);restore(previous);}
  function redo() {const next=future[0];if(!next)return;setFuture(future.slice(1));setPast([...past,design].slice(-30));restore(next);}
  function save() {try {localStorage.setItem(key,JSON.stringify(design));setMessage('Saved on this device. Same-origin scripts and other people using this browser profile can access it. Remove the device draft on shared devices.');}catch{setMessage('Device storage is unavailable or full. Download the design file instead.');}}
  function load() {try {const source=localStorage.getItem(key);if(!source){setMessage('No device draft found.');return;}const next=parseStudioDraft(source);cancelWork();if(commit(next)){setZoneId(getProductModel(next.productId).zones[0].id);setSelected('');setMessage('Saved draft reopened.');}}catch{setMessage('This draft is invalid or no longer matches its model. The current design is preserved.');}}
  async function importDesign(file:File|undefined) {if(!file)return;const request=beginWork('draft');if(request===null)return;try{if(file.size>6_000_000)throw new Error('Too large');const source=await file.text();if(request!==generation.current)return;const next=parseStudioDraft(source);cancelWork();if(commit(next)){setZoneId(getProductModel(next.productId).zones[0].id);setSelected('');setMessage('Design file reopened. No file was uploaded.');}}catch{if(request===generation.current)setMessage('Choose a valid studio design JSON file up to 6 MB. Product versions and artwork boundaries must match.');}finally{finishWork(request);}}
  async function exportProof() {
    const request=beginWork('reference');if(request===null)return;
    const snapshot=latest.current,blank=getProductModel(snapshot.productId);
    try {const current=reviseProof(proof.current,snapshot);const views=[];
      for(const surface of blank.zones.map(z=>z.surface)) {
        if(request!==generation.current)return;
        const canvas=document.createElement('canvas');
        try {await paintLayout(canvas,blank,snapshot,surface);if(request!==generation.current)return;views.push({surface,image:canvas.toDataURL('image/png')});}
        finally {canvas.width=0;canvas.height=0;}
      }
      const reference={kind:'local-layout-reference',orderNumber:null,sku:blank.sku,product:blank.name,proofVersion:current.version,createdAt:new Date().toISOString(),approvalStatus:'awaiting_vendor',configuration:snapshot,views,customerNotes:snapshot.notes,vendorNotes:null,notice:previewNotice};
      downloadLocal(new Blob([JSON.stringify(reference,null,2)],{type:'application/json'}),'virtual-ink-layout-reference.json');proof.current=current;setMessage(`Layout reference v${current.version} downloaded with saved configuration and all available surfaces. An assigned vendor must issue an order-specific proof; this file authorizes no production.`);
    } catch {if(request===generation.current)setMessage('Could not generate the layout reference. Remove artwork and retry.');}finally{finishWork(request);}
  }
  return <div className="product-studio">
    <div className="studio-toolbar"><span className="studio-badge">DESIGN LAB / EARLY PREVIEW</span><div><button type="button" onClick={undo} disabled={!past.length}>Undo</button><button type="button" onClick={redo} disabled={!future.length}>Redo</button><button type="button" onClick={save}>Save on device</button><button type="button" onClick={load}>Reopen draft</button>{busy&&<button type="button" onClick={()=>{cancelWork();setMessage('Preparation cancelled. Your current design is unchanged.');}}>Cancel preparation</button>}</div></div>
    <div className="studio-grid"><aside className="studio-panel"><p className="studio-kicker">THE BLANK CANVAS</p><h2>Your product.</h2>
      <label>Product model<select value={product.id} onChange={e=>switchProduct(e.target.value)}>{productModels.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <p className="studio-small">{product.sku} · {product.modelVersion}<br/>Draft study · supply and specifications unverified</p>
      <fieldset><legend>Product colour</legend><div className="studio-swatches">{product.colours.map(c=><button type="button" key={c.hex} aria-label={c.name} aria-pressed={design.colour===c.hex} style={{background:c.hex}} onClick={()=>commit({...design,colour:c.hex})}/>)}</div><p className="studio-small">Compare colours; artwork stays in place.</p></fieldset>
      <label>Size<select value={design.size} onChange={e=>commit({...design,size:e.target.value})}>{product.sizes.map(size=><option key={size}>{size}</option>)}</select></label>
      <p className="studio-small">Supplier size grading and size chart pending. Reference dimensions are illustrative.</p>
      <label>Decoration method<select value={design.method} onChange={e=>commit({...design,method:e.target.value as Method})}>{product.printMethods.filter(m=>zone.methods.includes(m)).map(m=><option key={m}>{m}</option>)}</select></label>
      <label>Quantity<input type="number" min={1} max={1000} value={design.quantity} onChange={e=>{const q=Number(e.target.value);if(Number.isInteger(q)&&q>0&&q<=1000)commit({...design,quantity:q});}}/></label>
      <div className="studio-boundary"><strong>Awaiting catalogue approval</strong><p>Vendor, stock, ZMW pricing, dimensions and production assets need verification.</p></div>
    </aside><div className="studio-centre"><ProductStudioPreview key={product.id} product={product} design={design} surface={zone.surface}/>
      <div className="studio-surfaces" aria-label="Decoration surface">{product.zones.map(z=><button type="button" key={z.id} aria-pressed={zone.id===z.id} onClick={()=>{setZoneId(z.id);setSelected('');}}>{z.name}<span>{z.widthMm} × {z.heightMm} mm</span></button>)}</div>
      <p className="studio-disclaimer">{previewNotice}</p><p className="studio-small">Restricted: {product.restrictedZones.join(', ')}. Only the measured safe zone accepts artwork. This model is an original geometric study; it has not been matched to a supplier SKU.</p>
    </div><aside className="studio-panel"><p className="studio-kicker">MAKE YOUR MARK</p><h2>Your design.</h2>
      <div className="studio-add"><button type="button" onClick={addText}>+ Add text</button><label className="studio-file">+ Add artwork<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e=>{void artwork(e.target.files?.[0]);e.currentTarget.value='';}}/></label></div>
      <p className="studio-small">PNG / JPEG · 2 MB · processed in this browser. SVG / PDF acceptance awaits secure vendor preflight.</p>
      <label>Layer<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select a layer</option>{design.layers.filter(l=>l.zoneId===zone.id).map((l,i)=><option key={l.id} value={l.id}>{i+1}. {l.kind==='text'?l.text||'Empty text':'Artwork'}</option>)}</select></label>
      {layer&&layer.zoneId===zone.id&&<fieldset><legend>Edit selected layer</legend>{layer.kind==='text'&&<><label>Text<textarea maxLength={160} value={layer.text} onChange={e=>{if(e.target.value.split('\n').length<=4)patchLayer({text:e.target.value});}}/></label><label>Approved font<select value={layer.font} onChange={e=>patchLayer({font:e.target.value as StudioLayer['font']})}>{['Poppins','Bebas Neue','Caveat'].map(f=><option key={f}>{f}</option>)}</select></label><label>Text colour<input type="color" value={layer.colour} onChange={e=>patchLayer({colour:e.target.value})}/></label></>}
        <form className="studio-measurements" key={[layer.id,zone.id,layer.x,layer.y,layer.width,layer.height,layer.rotation].join(':')} onSubmit={e=>{e.preventDefault();applyMeasurements(e.currentTarget);}} onInvalid={()=>setMessage('Check the measurement limits shown beside each field. Your design is unchanged.')}>
          <p id="studio-measurements-help" className="studio-small">Enter centre positions and unrotated dimensions in mm, and rotation in degrees. Apply measurements to update together. Safe-area fitting may adjust the result.</p>
          {measurements.map(([field,title,min,max,unit])=><div key={field}><label htmlFor={`studio-measurement-${field}`}>{title} ({unit}) · {min} to {max}</label><input id={`studio-measurement-${field}`} name={field} type="number" required min={min} max={max} step="any" inputMode="decimal" enterKeyHint="done" defaultValue={layer[field]} aria-describedby="studio-measurements-help"/></div>)}
          <div className="studio-actions"><button type="submit">Apply measurements</button><button type="reset">Reset entries</button></div>
        </form>
        {([['x','Horizontal position',zone.widthMm],['y','Vertical position',zone.heightMm],['width','Width',zone.widthMm],['height','Height',zone.heightMm],['rotation','Rotation',180]] as const).map(([field,title,max])=><label key={field}>{title} · {Math.round(layer[field]*100)/100}{field==='rotation'?'°':' mm'}<input type="range" min={field==='rotation'?-180:field==='width'||field==='height'?.1:0} max={max} step="any" value={layer[field]} onChange={e=>patchLayer({[field]:Number(e.target.value)})}/></label>)}
        <div className="studio-actions"><button type="button" onClick={()=>patchLayer({x:zone.widthMm/2,y:zone.heightMm/2})}>Centre</button><button type="button" onClick={()=>{if(design.layers.length>=12)return;const copy={...layer,id:crypto.randomUUID()};commit({...design,layers:[...design.layers,copy]});setSelected(copy.id);}}>Duplicate layer</button><button type="button" onClick={()=>{commit({...design,layers:design.layers.filter(l=>l.id!==layer.id)});setSelected('');}}>Remove</button></div>
      </fieldset>}
      <label>Customer notes<textarea maxLength={1000} value={design.notes} onChange={e=>commit({...design,notes:e.target.value})}/></label>
      <div className="studio-actions"><button type="button" onClick={()=>{downloadLocal(new Blob([JSON.stringify(design)],{type:'application/json'}),'virtual-ink-design.json');setMessage('Design copy downloaded. Keep it private; it contains your artwork.');}}>Download design copy</button><button type="button" onClick={()=>{try{localStorage.removeItem(key);setMessage('Device draft removed. The open design stays in this tab.');}catch{setMessage('Browser storage could not be accessed.');}}}>Remove device draft</button></div><label>Reopen design file<input type="file" accept="application/json,.json" disabled={busy} onChange={e=>{void importDesign(e.target.files?.[0]);e.currentTarget.value='';}}/></label>
    </aside></div>
    <div className="studio-bottom"><div><p className="studio-kicker">BEFORE IT GOES TO PRINT</p><h2>Check the details.</h2><p className="studio-small">Text contrast uses a 3:1 screen-preview guideline. Image colours, overlapping artwork and physical ink contrast need vendor review.</p><ul aria-live="polite" aria-label="Artwork checks">{warnings.map(w=><li key={w}>{w}</li>)}</ul></div><div className="studio-proof"><p>Save a layout reference with your configuration, physical print boundaries and separate views.</p><button className="button button-primary" type="button" disabled={busy} onClick={()=>void exportProof()}>{busy?'Preparing…':'Generate layout reference'}</button><Link className="text-link" href="/design-services">Request professional design assistance →</Link><button type="button" disabled>Add to cart · vendor verification required</button></div></div>
    <p className="studio-message" role="status">{message}</p>
  </div>;
}
