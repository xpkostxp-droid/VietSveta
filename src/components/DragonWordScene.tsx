import { useEffect, useRef } from 'react';
import { drawDragonScene, type DragonOutcome } from './dragonRenderer';
export function DragonWordScene({word,nextWord,outcome,paused}:{word:string;nextWord:string;outcome:DragonOutcome;paused:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const state=useRef({word,nextWord,outcome,paused});state.current={word,nextWord,outcome,paused};
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  const atlas=new Image(),wood=new Image();atlas.src=import.meta.env.BASE_URL+'dragon-media/poses.webp';wood.src=import.meta.env.BASE_URL+'dragon-media/board.webp';
  let frame=0,elapsed=0,last=performance.now(),previous:DragonOutcome='question';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  const draw=(now:number)=>{
   const s=state.current;
   if(s.outcome!==previous){elapsed=0;previous=s.outcome;last=now}
   if(!s.paused&&s.outcome!=='question')elapsed+=Math.max(0,now-last);last=now;
   drawDragonScene(ctx,atlas,wood,s.word,s.nextWord,s.outcome,elapsed/1000,reduced);
   frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  return()=>cancelAnimationFrame(frame);
 },[]);
 return <canvas ref={canvas} width={600} height={420} className="dragon-scene" role="img" aria-label={`Дракончик · ${word}`} />;
}
