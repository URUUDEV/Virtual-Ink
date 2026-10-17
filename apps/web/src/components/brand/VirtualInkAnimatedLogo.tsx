'use client';
import { useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import type { LogoScene } from './vi-scene';
import type { VirtualInkAnimatedLogoProps } from './brand-types';
import VILogoSVG from './VILogoSVG';
import './brand.css';
export type { AnimationMode,BackgroundMode,VirtualInkAnimatedLogoProps } from './brand-types';
function subscribeMotion(notify:()=>void){const query=matchMedia('(prefers-reduced-motion: reduce)');query.addEventListener('change',notify);return()=>query.removeEventListener('change',notify);}
const reducedSnapshot=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverMotion=()=>true;
export default function VirtualInkAnimatedLogo({size=520,autoRotate=true,rotationSpeed=10,showWordmark=true,showTagline=true,animationMode='intro',backgroundMode='dark',interactive=true,paused=false,replayToken=0,onIntroComplete,className=''}:VirtualInkAnimatedLogoProps){
  const reduced=useSyncExternalStore(subscribeMotion,reducedSnapshot,serverMotion);
  const [entered,setEntered]=useState(false),[readyFor,setReadyFor]=useState(''),[revealedFor,setRevealedFor]=useState(''),[failedFor,setFailedFor]=useState('');
  const wrap=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),scene=useRef<LogoScene|null>(null),drag=useRef<{id:number;x:number;time:number}|null>(null);
  const callbacks=useRef(onIntroComplete),configuration=useRef({mode:animationMode,autoRotate,rotationSpeed,paused,interactive});
  useLayoutEffect(()=>{callbacks.current=onIntroComplete;configuration.current={mode:animationMode,autoRotate,rotationSpeed,paused,interactive};scene.current?.configure(configuration.current);},[animationMode,autoRotate,rotationSpeed,paused,interactive,onIntroComplete]);
  const instance=`${animationMode}:${replayToken}`,staticMode=reduced||animationMode==='static'||failedFor===instance,ready=readyFor===instance&&!staticMode;
  useEffect(()=>{const target=wrap.current;if(!target)return;const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting){setEntered(true);observer.disconnect();}},{rootMargin:'0px',threshold:.05});observer.observe(target);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if(!entered||staticMode||!canvas.current)return;
    let cancelled=false;const target=canvas.current;
    // Importing this module is the first point at which Three.js can be requested.
    void Promise.resolve().then(()=>{
      if(cancelled)return null;
      const probe=document.createElement('canvas');
      const gl=probe.getContext('webgl2',{powerPreference:'low-power'});
      if(!gl)throw new Error('WebGL is unavailable.');
      gl.getExtension('WEBGL_lose_context')?.loseContext();probe.width=0;probe.height=0;
      return import('./vi-scene');
    }).then(module=>{
      if(cancelled||!module)return;
      const current=module.createLogoScene(target,configuration.current,{ready:()=>{if(!cancelled)setReadyFor(instance);},reveal:()=>{if(!cancelled)setRevealedFor(instance);},complete:()=>{if(!cancelled)callbacks.current?.();},failed:()=>{if(!cancelled)setFailedFor(instance);}});
      if(cancelled)current.dispose();else scene.current=current;
    }).catch(()=>{if(!cancelled)setFailedFor(instance);});
    return()=>{cancelled=true;scene.current?.dispose();scene.current=null;drag.current=null;};
  },[entered,staticMode,instance]);
  useEffect(()=>{if(animationMode==='intro'&&(failedFor===instance||matchMedia('(prefers-reduced-motion: reduce)').matches))callbacks.current?.();},[staticMode,animationMode,replayToken,failedFor,instance]);
  const style={'--vi-stage-height':`${Math.max(64,Math.min(size,900))}px`,'--vi-wordmark-size':`${Math.max(22,size*.055)}px`,'--vi-tagline-size':`${Math.max(10,size*.017)}px`} as CSSProperties;
  function endDrag(){drag.current=null;scene.current?.endDrag();}
  return <div ref={wrap} className={`vi-brand-stage vi-brand-${backgroundMode} ${className}`} style={style} data-logo-state={staticMode?'static':ready?'animated':'fallback'}>
    <div className={`vi-logo-fallback ${ready?'vi-is-hidden':''}`} aria-hidden={ready}><VILogoSVG size={Math.min(size*.82,460)} showWordmark={showWordmark} showTagline={showTagline} tone={backgroundMode==='transparent'?'inherit':backgroundMode==='light'?'light':'dark'}/></div>
    {!staticMode&&<canvas ref={canvas} aria-hidden={!ready} role="img" tabIndex={ready&&interactive?0:-1} aria-label={interactive?'Virtual Ink animated monogram. Use left and right arrow keys to rotate.':'Virtual Ink animated monogram'}
      style={{touchAction:interactive?'pan-y':'auto',cursor:interactive?'grab':'default'}} onKeyDown={event=>{if(!interactive||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();scene.current?.rotate(event.key==='ArrowLeft'?-.15:.15);}}
      onPointerDown={event=>{if(!interactive||!ready)return;drag.current={id:event.pointerId,x:event.clientX,time:performance.now()};scene.current?.beginDrag();event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>{if(!interactive||drag.current?.id!==event.pointerId)return;const now=performance.now();scene.current?.rotate((event.clientX-drag.current.x)*.0085,(now-drag.current.time)/1000);drag.current.x=event.clientX;drag.current.time=now;}}
      onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}/>}
    {ready&&showWordmark&&<div className={`vi-wordmark ${animationMode==='idle'||revealedFor===instance?'vi-wordmark-visible':''}`} aria-hidden={animationMode==='intro'&&revealedFor!==instance}>
      <div>VIRTUAL <span>INK</span></div>{showTagline&&<p>DESIGN · PRINT · ORDER · DELIVER</p>}
    </div>}
  </div>;
}
