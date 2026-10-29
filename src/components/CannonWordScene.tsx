import {useRef,type CSSProperties} from 'react';
import './CannonWordScene.css';
export function CannonWordScene({word,outcome,paused,progress}:{word:string;outcome:'question'|'success'|'failed';paused:boolean;progress:number}){
 const last=useRef(0);if(outcome==='question')last.current=Math.min(.99,Math.max(0,progress));
 return <div className={'at-board cannon-scene cannon-'+outcome+(paused?' cannon-paused':'')} style={{'--fall-y':`${last.current*74}px`} as CSSProperties} aria-label="Слово и пушка">
  <div className="cannon-cloud"/><div className="cannon-ground"/>
  <div className="cannon-target"><div className="cannon-word"><span>{word}</span></div></div>
  <svg className="word-cannon" viewBox="0 0 130 90" aria-hidden="true"><ellipse cx="65" cy="82" rx="55" ry="6" fill="#508a7555"/><path d="M25 73 42 45h45l22 28Z" fill="#b17d40" stroke="#73552e" strokeWidth="3"/><g className="cannon-barrel"><path d="M49 52 47 13q18-12 36 0l-3 39Z" fill="#488c90" stroke="#285960" strokeWidth="4"/><ellipse cx="65" cy="13" rx="18" ry="7" fill="#193b48" stroke="#77b6b2" strokeWidth="3"/></g><circle cx="38" cy="71" r="14" fill="#dcad66" stroke="#7c5b37" strokeWidth="4"/><circle cx="92" cy="71" r="14" fill="#dcad66" stroke="#7c5b37" strokeWidth="4"/><circle cx="38" cy="71" r="4" fill="#7c5b37"/><circle cx="92" cy="71" r="4" fill="#7c5b37"/></svg>
  {outcome==='success'&&<><i className="cannon-ball"/><span className="cannon-flash" aria-hidden="true">✦</span><div className="cannon-burst" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i}/>)}</div></>}
  {outcome==='failed'&&<div className="cannon-dust" aria-hidden="true"/>}
 </div>;
}
