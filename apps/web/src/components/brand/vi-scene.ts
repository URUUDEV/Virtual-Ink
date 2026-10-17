/** Three.js port of the supplied VirtualInkAnimatedLogo VIScene. Shapes/timing are preserved. */
import * as T from 'three';
import { BRAND_MOTION as TIME } from '@shared/brand-tokens';
import { BRAND,PIXELS,LAYOUT,buildVGeometry,buildIGeometry,buildDropletGeometry,buildPixelGeometry,sampleVPoint,clamp01,easeInOutCubic,easeOutBack,easeOutCubic } from './vi-geometry';
import type { AnimationMode } from './brand-types';
export type SceneConfig={ mode:AnimationMode;autoRotate:boolean;rotationSpeed:number;paused:boolean;interactive:boolean };
export type LogoScene={configure:(config:SceneConfig)=>void;reset:()=>void;beginDrag:()=>void;endDrag:()=>void;rotate:(delta:number,elapsed?:number)=>void;dispose:()=>void};
export function createLogoScene(canvas:HTMLCanvasElement,initial:SceneConfig,callbacks:{ready:()=>void;reveal:()=>void;complete:()=>void;failed:()=>void}):LogoScene {
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:!matchMedia('(pointer: coarse)').matches,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer: coarse)').matches?1.5:2));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,40),fit=new T.Group(),root=new T.Group();
  camera.position.set(0,.15,8.8);scene.add(fit);fit.add(root);root.position.y=LAYOUT.groupLift;
  scene.add(new T.AmbientLight('#ffffff',.55));const directional=new T.DirectionalLight('#ffffff',1.15);directional.position.set(2.5,3.5,5);scene.add(directional);
  for(const [position,intensity,colour] of [[[ -4.5,2,3],26,BRAND.cyan],[[4.5,1.5,3],22,BRAND.magenta],[[0,-3.5,4],10,BRAND.blue]] as const){const light=new T.PointLight(colour,intensity);light.position.set(position[0],position[1],position[2]);scene.add(light);}
  const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[];
  const options={vertexColors:true,roughness:.28,metalness:.08,clearcoat:.7,clearcoatRoughness:.22,transparent:true};
  function mesh(g:T.BufferGeometry,position:readonly number[],extra:T.MeshPhysicalMaterialParameters={}){const material=new T.MeshPhysicalMaterial({...options,...extra});const m=new T.Mesh(g,material);m.position.set(position[0],position[1],position[2]);geometries.push(g);materials.push(material);root.add(m);return m;}
  const v=mesh(buildVGeometry(),LAYOUT.v),i=mesh(buildIGeometry(),LAYOUT.i,{roughness:.2,clearcoat:.9}),drop=mesh(buildDropletGeometry(),LAYOUT.droplet,{roughness:.12,clearcoat:1});
  const pixels=PIXELS.map(p=>mesh(buildPixelGeometry(p.size),p.home,{roughness:.35}));
  const positions=new Float32Array(TIME.particles*3),colours=new Float32Array(TIME.particles*3),palette=[BRAND.cyan,BRAND.blue,BRAND.purple,BRAND.magenta].map(c=>new T.Color(c));
  const particles=Array.from({length:TIME.particles},(_,index)=>{const colour=palette[Math.floor(Math.random()*palette.length)];colours.set([colour.r,colour.g,colour.b],index*3);return {r0:3.4+Math.random()*3.4,theta0:Math.random()*Math.PI*2,y0:(Math.random()-.5)*5,omega:1.6+Math.random()*2.2,dir:Math.random()<.5?1:-1,target:sampleVPoint(Math.random)};});
  const particleGeometry=new T.BufferGeometry();particleGeometry.setAttribute('position',new T.BufferAttribute(positions,3));particleGeometry.setAttribute('color',new T.BufferAttribute(colours,3));geometries.push(particleGeometry);
  const particleMaterial=new T.PointsMaterial({size:.055,vertexColors:true,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true});materials.push(particleMaterial);
  const points=new T.Points(particleGeometry,particleMaterial);fit.add(points);
  function ring(radius:number,width:number,colour:string,rotation:readonly[number,number,number]){const material=new T.MeshBasicMaterial({color:colour,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});const g=new T.TorusGeometry(radius,width,8,96),m=new T.Mesh(g,material);geometries.push(g);materials.push(material);m.rotation.set(...rotation);fit.add(m);return m;}
  const ring1=ring(2.3,.012,BRAND.cyan,[Math.PI/2.6,0,0]),ring2=ring(1.8,.009,BRAND.magenta,[Math.PI/1.9,.4,0]);
  let config=initial,t=0,idle=initial.mode!=='intro',angle=0,dragAngle=0,dragVelocity=0,dragging=false,frame=0,previous=0,onScreen=false,disposed=false,revealed=false,completed=false,ready=false;
  function opacity(m:T.Mesh<T.BufferGeometry,T.MeshPhysicalMaterial>,value:number){m.material.opacity=value;m.visible=value>.001;}
  function draw(dt:number){
    if(!config.paused){if(!idle)t+=dt;else if(config.autoRotate&&!dragging)angle+=dt*Math.PI*2/Math.max(8,Math.min(12,config.rotationSpeed));if(!dragging&&Math.abs(dragVelocity)>.0001){dragAngle+=dragVelocity*dt;dragVelocity*=Math.pow(.06,dt);}}
    root.rotation.y=(idle?angle:t<TIME.rotationStart?0:easeInOutCubic(clamp01((t-TIME.rotationStart)/(TIME.rotationEnd-TIME.rotationStart)))*Math.PI*2)+dragAngle;
    if(!idle){
      const vo=clamp01((t-TIME.formation)/.5),vs=t<TIME.formation?.55:.55+.45*easeOutBack(clamp01((t-TIME.formation)/1.1),1.4);
      opacity(v,vo);v.scale.setScalar(Math.max(.0001,vs));v.position.y=LAYOUT.v[1]+(1-easeOutCubic(vo))*.5;
      opacity(i,clamp01((t-1.7)/.35));i.position.y=LAYOUT.i[1]-(1-easeOutCubic(clamp01((t-1.7)/.9)))*3.2;
      opacity(drop,clamp01((t-2.1)/.3));drop.scale.setScalar(Math.max(.0001,easeOutBack(clamp01((t-2.1)/.7),2)));
      PIXELS.forEach((p,index)=>{const start=TIME.formation+.05+p.delay,u=easeOutCubic(clamp01((t-start)/.9)),m=pixels[index];opacity(m,clamp01((t-start)/.3));m.position.set(...p.scatter.map((value,axis)=>T.MathUtils.lerp(value,p.home[axis],u)) as [number,number,number]);m.rotation.z=(1-u)*p.spin;});
      particles.forEach((p,index)=>{let x:number,y:number,z:number;if(t<TIME.formation){const u=easeInOutCubic(t/TIME.formation),r=T.MathUtils.lerp(p.r0,1.35,u),theta=p.theta0+p.omega*p.dir*t*2.2;x=Math.cos(theta)*r;y=T.MathUtils.lerp(p.y0,0,u);z=Math.sin(theta)*r*.45;}else{const u=easeInOutCubic(clamp01((t-TIME.formation)/1.4)),theta=p.theta0+p.omega*p.dir*TIME.formation*2.2;x=T.MathUtils.lerp(Math.cos(theta)*1.35,p.target[0],u);y=p.target[1]*u;z=T.MathUtils.lerp(Math.sin(theta)*1.35*.45,p.target[2],u);}positions.set([x,y,z],index*3);});
      particleGeometry.attributes.position.needsUpdate=true;points.visible=t<2.85;particleMaterial.opacity=t<2.4?.95:.95*(1-clamp01((t-2.4)/.4));
      ring1.material.opacity=.5*clamp01(t/.5)*(1-clamp01((t-TIME.formation)/.6));ring2.material.opacity=.35*clamp01(t/.5)*(1-clamp01((t-TIME.formation)/.6));ring1.rotation.z=t*1.4;ring2.rotation.z=-t*.9;
      if(t>=TIME.reveal&&!revealed){revealed=true;callbacks.reveal();}
      if(t>=TIME.complete&&!completed){idle=true;completed=true;angle=0;dragAngle=0;callbacks.complete();}
    }else{
      for(const m of [v,i,drop,...pixels]){opacity(m,1);m.scale.setScalar(1);}v.position.set(...LAYOUT.v);i.position.set(...LAYOUT.i);PIXELS.forEach((p,index)=>{pixels[index].position.set(...p.home);pixels[index].rotation.z=0;});points.visible=false;ring1.material.opacity=0;ring2.material.opacity=0;
    }
    renderer.render(scene,camera);if(!ready){ready=true;callbacks.ready();}
  }
  const moving=()=>!config.paused&&(!idle||config.autoRotate&&!dragging||Math.abs(dragVelocity)>.0001&&!dragging);
  function schedule(){if(disposed||frame||!onScreen||document.hidden)return;frame=requestAnimationFrame(timestamp=>{frame=0;if(disposed||!onScreen||document.hidden)return;try{const dt=previous?Math.min((timestamp-previous)/1000,.05):0;previous=timestamp;draw(dt);if(moving())schedule();}catch{callbacks.failed();}});}
  function resize(){if(disposed)return;const bounds=canvas.getBoundingClientRect(),w=Math.max(1,bounds.width),h=Math.max(1,bounds.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const worldHeight=2*Math.tan(38*Math.PI/360)*8.8;fit.scale.setScalar(Math.min(1,worldHeight*camera.aspect/6.1,worldHeight/5.7));schedule();}
  function visibility(){previous=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);const intersection=new IntersectionObserver(entries=>{onScreen=entries[0]?.isIntersecting??false;previous=0;if(!onScreen){cancelAnimationFrame(frame);frame=0;}else schedule();},{threshold:.05});intersection.observe(canvas);
  document.addEventListener('visibilitychange',visibility);const lost=(event:Event)=>{event.preventDefault();callbacks.failed();};canvas.addEventListener('webglcontextlost',lost);resize();
  return {configure(next){const modeChanged=config.mode!==next.mode;config=next;if(modeChanged){t=0;idle=next.mode!=='intro';angle=0;dragVelocity=0;revealed=false;completed=false;}previous=0;schedule();},reset(){t=0;idle=config.mode!=='intro';angle=0;dragAngle=0;dragVelocity=0;revealed=false;completed=false;previous=0;schedule();},beginDrag(){dragging=true;dragVelocity=0;},endDrag(){dragging=false;schedule();},rotate(delta,elapsed){if(config.interactive){dragAngle+=delta;dragVelocity=dragging&&elapsed?T.MathUtils.lerp(dragVelocity,delta/Math.max(.001,elapsed),.35):0;schedule();}},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();}};
}
