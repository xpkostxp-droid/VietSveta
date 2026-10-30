import { useEffect, useRef, useState } from 'react';
import './TopicWheel.css';
const rowHeight = 54;
export function TopicWheel({items,value,onChange}:{items:{id:string;title:string}[];value:string;onChange:(value:string)=>void}) {
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
  <div ref={viewport} className="topic-wheel-scroll" role="listbox" aria-label="Выбери тему" aria-activedescendant={`battle-topic-${items[selected]?.id}`} tabIndex={0}
   onKeyDown={e=>{const target=e.key==='ArrowDown'?selected+1:e.key==='ArrowUp'?selected-1:e.key==='Home'?0:e.key==='End'?items.length-1:null;if(target!==null){e.preventDefault();choose(target);}}}
   onScroll={e=>{const index=Math.max(0,Math.min(items.length-1,e.currentTarget.scrollTop/rowHeight));setPosition(index);const next=items[Math.round(index)];if(next&&next.id!==value){localValue.current=next.id;onChange(next.id);}}}>
   {items.map((item,i)=>{const distance=Math.max(-2,Math.min(2,i-position));return <div className="topic-wheel-row" key={item.id}><button type="button" id={`battle-topic-${item.id}`} role="option" aria-selected={item.id===value} tabIndex={-1} onClick={()=>choose(i)} style={{transform:`perspective(500px) rotateX(${distance*-24}deg) scale(${1-Math.abs(distance)*.09})`,opacity:Math.max(.2,1-Math.abs(distance)*.38)}}>{item.title}</button></div>;})}
  </div>
  <div className="topic-wheel-fade topic-wheel-fade-top" aria-hidden="true"/><div className="topic-wheel-fade topic-wheel-fade-bottom" aria-hidden="true"/>
 </div>;
}
