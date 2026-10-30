import { useEffect, useRef, useState } from 'react';
import { sceneTiming, type CourtState } from './battleScene';
import './BattleCourt.css';

type Sprite = { image: HTMLCanvasElement; height: number; anchor: number; feet: number; paddle: [number, number] };
type Assets = { court: HTMLImageElement; blue: Sprite[][]; red: Sprite[][] };
const W = 960, H = 640;
let cached: Promise<Assets> | null = null;
function image(src: string): Promise<HTMLImageElement> {
 return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}
function sprites(atlas: HTMLImageElement, red: boolean): Sprite[][] {
 const cuts = [0,390,785,1230,atlas.width], ch = atlas.height / 2;
 return [0,1].map(row => [0,1,2,3].map(col => {
  const tile = document.createElement('canvas'); tile.width = cuts[col+1]-cuts[col]; tile.height = ch;
  const c = tile.getContext('2d')!; c.drawImage(atlas,cuts[col],row*ch,tile.width,ch,0,0,tile.width,ch);
  const pixels = c.getImageData(0,0,tile.width,ch), d = pixels.data;
  let top = ch, bottom = 0, footX = 0, count = 0;
  for(let y=0;y<ch;y++)for(let x=0;x<tile.width;x++){
   const k=(y*tile.width+x)*4;
   if(d[k+3]>70){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   // Runtime uniform palette: change blue/cyan cloth only, preserving skin and the approved pose.
   if(red && d[k+3]>0 && d[k+2]>d[k]*1.12 && d[k+1]>d[k]*1.06 && d[k+2]>35){
    const light=Math.max(d[k],d[k+1],d[k+2]);
    d[k]=Math.min(255,light*1.05);d[k+1]=light*.24;d[k+2]=light*.29;
   }
  }
  for(let y=Math.round(top+(bottom-top)*.82);y<=bottom;y++)for(let x=0;x<tile.width;x++){
   if(d[(y*tile.width+x)*4+3]>90){footX+=x;count++;}
  }
  if(red)c.putImageData(pixels,0,0);
  // Contact positions are in the approved forehand contact cells (pose 2).
  const paddle: [number,number] = row===0 ? [tile.width*.84,ch*.38] : [tile.width*.12,ch*.36];
  return {image:tile,height:bottom-top,anchor:footX/Math.max(1,count),feet:bottom,paddle};
 }));
}
export function preloadCourt() {
 if (!cached) cached = Promise.all([image('./battle-media/court-clean-v1.jpg'), image('./battle-media/male-poses-v1.webp')])
  .then(([court,atlas])=>({court,blue:sprites(atlas,false),red:sprites(atlas,true)}))
  .catch(error=>{cached=null;throw error;});
 return cached;
}
function pose(t: number, hit: number) {
 const d=t-hit;return d<-.20||d>.32?0:d<-.045?1:d<.07?2:3;
}
export function BattleCourt({state,onHit}:{state:CourtState;onHit:(kind:'paddle'|'bounce',near:boolean)=>void}) {
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({state,onHit,received:performance.now()});
 latest.current={state,onHit,received:performance.now()};
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let stopped=false,raf=0,last=0,lastSound='';
  const boot=async()=>{
   try{
    const a=await preloadCourt();if(stopped)return;
    const c=canvas.current?.getContext('2d');if(!c){setFailed(true);return;}
    const draw=(stamp:number)=>{
     if(stopped)return;raf=requestAnimationFrame(draw);if(stamp-last<32)return;last=stamp;
     const v=latest.current,s={...v.state,now:v.state.now+Math.max(0,stamp-v.received)};
     const timing=sceneTiming(s),t=timing.seconds,side=timing.corner;
     const nx=(side?.73:.27)*W,fx=(side?.18:.72)*W,nf=.94*H,ff=.61*H;
     const nset=(s.nearBlue?a.blue:a.red)[0],fset=(s.nearBlue?a.red:a.blue)[1];
     const step=.72;
     let np=0,fp=0,ball:{x:number;y:number;r:number}|null=null,soundKey='',soundKind:'paddle'|'bounce'='paddle',soundNear=true;
     // All translations are fixed within one question. Only sprite poses change.
     const contact=(sp:Sprite,x:number,feet:number,height:number):[number,number]=>{
      const z=height/sp.height;return [x+(sp.paddle[0]-sp.anchor)*z,feet+(sp.paddle[1]-sp.feet)*z];
     };
     const near=contact(nset[2],nx,nf,.60*H),far=contact(fset[2],fx,ff,.255*H);
     if(timing.phase==='rally'){
      const capped=Math.min(t,5.7),k=Math.floor(capped/step),u=(capped%step)/step;
      const nh=k%2===0;
      const nHit=(nh?k:k+1)*step, fHit=(nh?k+1:k)*step;
      np=pose(capped,nHit);fp=pose(capped,fHit);
      const p=nh?near:far,q=nh?far:near,depth=nh?1-u:u;
      ball={x:p[0]*(1-u)+q[0]*u,y:p[1]*(1-u)+q[1]*u-Math.sin(Math.PI*u)*.11*H,r:4+5*depth};
      if(t<5.7){soundKey=s.key+':r:'+k;soundNear=nh;}
     } else if(timing.phase==='point'&&(s.winner==='near'||s.winner==='far')){
      const winNear=s.winner==='near',h=.24;
      np=winNear?pose(t,h):0;fp=winNear?0:pose(t,h);
      const p=winNear?near:far,q=winNear?[fx+.035*W,.61*H]:[nx-.13*W,.94*H];
      if(t<h)ball={x:p[0],y:p[1],r:winNear?9:5};
      else if(t<.72){const u=(t-h)/.48;ball={x:p[0]*(1-u)+q[0]*u,y:p[1]+(q[1]-p[1])*u*u,r:winNear?9-4*u:5+5*u};}
      else if(t<1.45){const u=(t-.72)/.73;ball={x:q[0]+(winNear?-.04:.04)*W*u,y:q[1]+(winNear?0:.13)*H*u-.09*H*Math.sin(Math.PI*u),r:winNear?5:10+2*u};}
      if(t>=h&&t<.72){soundKey=s.key+':point:p';soundNear=winNear;}
      else if(t>=.72&&t<1.5){soundKey=s.key+':point:b';soundKind='bounce';soundNear=!winNear;}
     }
     c.clearRect(0,0,W,H);c.drawImage(a.court,0,0,W,H);
     const shadow=(x:number,y:number,w:number)=>{c.fillStyle='#102f3544';c.beginPath();c.ellipse(x,y,w,7,0,0,Math.PI*2);c.fill();};
     shadow(fx,ff,35);shadow(nx,nf,75);
     const player=(sp:Sprite,x:number,feet:number,height:number)=>{
      const z=height/sp.height;c.drawImage(sp.image,x-sp.anchor*z,feet-sp.feet*z,sp.image.width*z,sp.image.height*z);
     };
     player(fset[fp],fx,ff,.255*H);
     // Recreate the plate's mesh only over the distant player's lower legs.
     c.save();c.beginPath();c.rect(fx-45,.55*H,90,.065*H);c.clip();c.strokeStyle='#10434a66';c.lineWidth=.7;
     for(let x=fx-45;x<fx+45;x+=6){c.beginPath();c.moveTo(x,.55*H);c.lineTo(x,.615*H);c.stroke();}
     for(let y=.55*H;y<.615*H;y+=6){c.beginPath();c.moveTo(fx-45,y);c.lineTo(fx+45,y);c.stroke();}c.restore();
     player(nset[np],nx,nf,.60*H);
     if(ball){const {x,y,r}=ball;c.fillStyle='#e9f52f';c.strokeStyle='#8a9d22';c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();
      c.fillStyle='#819620';for(const [dx,dy]of [[-.3,-.2],[.3,-.25],[0,.35]]){c.beginPath();c.arc(x+dx*r,y+dy*r,r*.14,0,Math.PI*2);c.fill();}
     }
     if(soundKey&&soundKey!==lastSound&&!document.hidden){lastSound=soundKey;v.onHit(soundKind,soundNear);}
    };
    raf=requestAnimationFrame(draw);
   }catch{if(!stopped)setFailed(true);}
  };
  void boot();return()=>{stopped=true;cancelAnimationFrame(raf);};
 },[]);
 return <div className="battle-court" style={{backgroundImage:"url('./battle-media/court-clean-v1.jpg')",backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'}} aria-label="Розыгрыш пиклбола">
  <canvas ref={canvas} width={W} height={H} role="img" aria-label="Твой игрок со спины, соперник напротив"/>
  {failed&&<span className="battle-court-fallback">Корт не загрузился — отвечать можно как обычно.</span>}
 </div>;
}
