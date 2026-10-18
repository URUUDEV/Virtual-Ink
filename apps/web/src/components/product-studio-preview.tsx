'use client';
import { useEffect, useRef, useState } from 'react';
import { type ProductModel } from '@shared/product-models';
import { type StudioDesign } from '@shared/studio-design';
import { type StudioViewer } from '@/lib/studio-viewer';
import { paintLayout } from '@/lib/studio-paint';
export function ProductStudioPreview({ product,design,surface }: {product:ProductModel;design:StudioDesign;surface:string}) {
  const [mode,setMode]=useState<'3d'|'layout'>(product.modelUrl?'3d':'layout'),[attempt,setAttempt]=useState(0);
  const [state,setState]=useState('Preparing selected model…');
  const canvas=useRef<HTMLCanvasElement>(null),layout=useRef<HTMLCanvasElement>(null),viewer=useRef<StudioViewer|null>(null),drag=useRef<{x:number;y:number}|null>(null);
  useEffect(()=>{
    if(mode!=='3d'||!canvas.current)return;
    let cancelled=false;
    const target=canvas.current;
    setState('Preparing selected model…');
    void import('@/lib/studio-viewer').then(module=>module.createStudioViewer(target,product,()=>{if(!cancelled)setState('3D unavailable. Switch to the layout view.');})).then(current=>{
      if(cancelled){current.dispose();return;}viewer.current=current;setState('3D ready');
    }).catch(()=>{if(!cancelled)setState('3D unavailable. Switch to the layout view or retry.');});
    return()=>{cancelled=true;viewer.current?.dispose();viewer.current=null;};
  },[product,mode,attempt]);
  useEffect(()=>{if(state!=='3D ready'||mode!=='3d')return;void viewer.current?.update(design).catch(()=>setState('3D unavailable. Switch to the layout view.'));},[design,state,mode]);
  useEffect(()=>{if(state==='3D ready')viewer.current?.view(surface==='back'?'back':'front');},[surface,state]);
  useEffect(()=>{
    if(mode!=='layout'||!layout.current)return;let cancelled=false;const target=layout.current,staging=document.createElement('canvas');
    void paintLayout(staging,product,design,surface).then(()=>{if(!cancelled){target.width=staging.width;target.height=staging.height;target.getContext('2d')?.drawImage(staging,0,0);}}).catch(()=>{if(!cancelled)setState('Layout could not be drawn. Remove artwork and retry.');});
    return()=>{cancelled=true;target.width=0;target.height=0;staging.width=0;staging.height=0;};
  },[product,design,surface,mode]);
  return <div className="studio-visual">
    <div className="studio-view-bar"><span>01 / PRODUCT VIEW</span><div>{product.modelUrl&&<button type="button" aria-pressed={mode==='3d'} onClick={()=>setMode('3d')}>3D</button>}<button type="button" aria-pressed={mode==='layout'} onClick={()=>setMode('layout')}>Layout / fallback</button></div></div>
    {/* A canvas cannot change context type after WebGL or 2D initialization. */}
    <div className="studio-stage">{mode==='3d'?<canvas key="3d" ref={canvas} aria-label="Product 3D view. Drag or use arrow keys to rotate." tabIndex={0} onKeyDown={e=>{const moves:Record<string,[number,number]>={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]};if(Object.hasOwn(moves,e.key)){e.preventDefault();viewer.current?.rotate(...moves[e.key]);}}}
      onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return;viewer.current?.rotate((e.clientX-drag.current.x)*.01,(e.clientY-drag.current.y)*.006);drag.current={x:e.clientX,y:e.clientY};}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}/>:<canvas key="layout" ref={layout} aria-label={`${surface} layout with physical safe area`} />}
    </div>
    {mode==='3d'&&<div className="studio-view-tools"><button type="button" onClick={()=>viewer.current?.view('front')}>Front</button><button type="button" onClick={()=>viewer.current?.view('back')}>Back</button><button type="button" aria-label="Zoom in" onClick={()=>viewer.current?.zoom(-.1)}>+</button><button type="button" aria-label="Zoom out" onClick={()=>viewer.current?.zoom(.1)}>−</button><button type="button" onClick={()=>viewer.current?.view(surface==='back'?'back':'front')}>Reset view</button><button type="button" onClick={()=>{setState('Preparing selected model…');setAttempt(n=>n+1);}}>Retry 3D</button></div>}
    <p className="studio-small" role="status">{mode==='3d'?state:'Size layout · independent of WebGL'} · Original geometry study. Vendor measurements and model approval pending.</p>
  </div>;
}
