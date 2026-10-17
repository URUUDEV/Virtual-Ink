'use client';
import {useEffect,useState} from 'react';
import VirtualInkAnimatedLogo from './VirtualInkAnimatedLogo';
const sessionKey='virtual-ink:brand-intro:v1';
let finishedInThisTab=false;
function hasFinished(){try{return finishedInThisTab||sessionStorage.getItem(sessionKey)==='complete';}catch{return finishedInThisTab;}}
export function HeroBrand(){
  const [finished,setFinished]=useState(false);
  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate a session-only preference after identical static server/client markup.
    setFinished(hasFinished());
  },[]);
  function finish(){finishedInThisTab=true;try{sessionStorage.setItem(sessionKey,'complete');}catch{/* Memory fallback remains session-scoped. */}setFinished(true);}
  return <div className="hero-brand-presentation"><VirtualInkAnimatedLogo size={480} animationMode={finished?'static':'intro'} autoRotate={false} interactive={false} onIntroComplete={finish}/>
    {!finished&&<button className="vi-skip-intro" type="button" onClick={finish}>Skip animation · continue exploring</button>}
    <p className="hero-brand-caption"><span/> Your next idea starts here.</p>
  </div>;
}
