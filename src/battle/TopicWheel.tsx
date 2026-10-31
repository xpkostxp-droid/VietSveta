import { useEffect, useRef, useState } from 'react';
import './TopicWheel.css';
const rowHeight = 54;
function TopicIcon({id}:{id:string}){
 const shape=id==='digits'?<><rect x="3" y="3" width="26" height="26" rx="5"/><text x="16" y="22" textAnchor="middle" fontSize="17" fontWeight="600" stroke="none" fill="currentColor">123</text></>
 :id==='fruits'?<><path d="M16 11c-4-5-12-2-11 6 1 7 4 11 7 11 2 0 3-1 4-1s2 1 4 1c3 0 7-5 7-11 0-8-7-11-11-6Z"/><path d="M16 11c-1-4 0-7 3-9m-1 6c5 0 7-3 8-6-5 0-8 2-8 6Z"/></>
 :id==='vegetables'?<><path d="M15 28C5 26 3 18 7 14c-2-5 3-10 7-8 3-5 9-3 10 1 6 1 6 8 2 10 0 7-5 11-11 11Z"/><path d="m10 26 11-16m-8 11-2-7m5 3 7-2"/></>
 :id==='questions'?<><path d="M27 15a11 11 0 0 1-15 10l-7 3 2-8a11 11 0 1 1 20-5Z"/><path d="M13 10a3 3 0 1 1 5 3c-2 1-2 2-2 4m0 4h.01"/></>
 :id==='harvest'?<><path d="M5 14h22l-3 13H8L5 14Zm4 0 4-8m10 8-4-8M12 19v4m8-4v4"/><path d="M3 14h26"/></>
 :id==='adjectives-1'?<><rect x="5" y="5" width="22" height="22" rx="4"/><path d="M10 5v7m6-7v4m6-4v7M5 17h7m-7 5h4"/></>
 :id==='adjectives-2'?<><circle cx="16" cy="10" r="5"/><path d="M5 28v-3c0-6 5-9 11-9s11 3 11 9v3"/></>
 :<><circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3"/></>;
 return <svg className="topic-wheel-icon" aria-hidden="true" focusable="false" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shape}</svg>;
}
export function TopicWheel({items,value,onChange,label='Выбери тему'}:{label?:string;items:{id:string;title:string}[];value:string;onChange:(value:string)=>void}) {
 const viewport=useRef<HTMLDivElement>(null);
 const localValue=useRef<string|null>(null);
 const [position,setPosition]=useState(()=>Math.max(0,items.findIndex(item=>item.id===value)));
 const ids=items.map(item=>item.id).join('|');
 const selected=Math.max(0,items.findIndex(item=>item.id===value));
 useEffect(()=>{
  const el=viewport.current;
  if(localValue.current===value)return;
  if(el&&Math.round(el.scrollTop/rowHeight)!==selected){el.scrollTop=selected*rowHeight;setPosition(selected);}
 },[value,ids]);
 const choose=(index:number)=>{
  const next=Math.max(0,Math.min(items.length-1,index));
  if(!items[next])return;
  localValue.current=items[next].id;onChange(items[next].id);
  const el=viewport.current;
  if(el){if(typeof el.scrollTo==='function')el.scrollTo({top:next*rowHeight,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});else el.scrollTop=next*rowHeight;}
 };
 return <div className="topic-wheel">
  <div className="topic-wheel-selection" aria-hidden="true"/>
  <div ref={viewport} className="topic-wheel-scroll" role="listbox" aria-label={label} aria-activedescendant={`battle-topic-${items[selected]?.id}`} tabIndex={0}
   onKeyDown={e=>{const target=e.key==='ArrowDown'?selected+1:e.key==='ArrowUp'?selected-1:e.key==='Home'?0:e.key==='End'?items.length-1:null;if(target!==null){e.preventDefault();choose(target);}}}
   onScroll={e=>{const index=Math.max(0,Math.min(items.length-1,e.currentTarget.scrollTop/rowHeight));setPosition(index);const next=items[Math.round(index)];if(next&&next.id!==value){localValue.current=next.id;onChange(next.id);}}}>
   {items.map((item,i)=>{const distance=Math.max(-2,Math.min(2,i-position));return <div className="topic-wheel-row" key={item.id}><button type="button" id={`battle-topic-${item.id}`} role="option" aria-selected={item.id===value} tabIndex={-1} onClick={()=>choose(i)} style={{transform:`perspective(500px) rotateX(${distance*-26}deg) scale(${1-Math.abs(distance)*.08})`,opacity:Math.max(.25,1-Math.abs(distance)*.28)}}><TopicIcon id={item.id}/><span className="topic-wheel-title" data-short={item.title.length<16}>{item.title}</span></button></div>;})}
  </div>
  <div className="topic-wheel-fade topic-wheel-fade-top" aria-hidden="true"/><div className="topic-wheel-fade topic-wheel-fade-bottom" aria-hidden="true"/>
 </div>;
}
