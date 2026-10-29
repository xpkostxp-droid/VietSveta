import './RopeWordScene.css';
export function RopeWordScene({word,outcome,paused}:{word:string;outcome:'question'|'success'|'failed';paused:boolean}){
 return <div className={'at-board rope-scene rope-'+outcome+(paused?' rope-paused':'')} aria-label="Табличка на тросах">
  <div className="rope-beam"><i/><i/></div>
  <div className="rope-hanger"><div className="rope-cable rope-cable-left"/><div className="rope-cable rope-cable-right"/><div className="rope-plaque"><span>{word}</span><i/><i/></div></div>
  {outcome==='failed'&&<div className="rope-shards" aria-hidden="true">{[0,1,2,3,4,5,6,7,8].map(i=><i key={i}/>)}<span className="rope-dust"/></div>}
  <div className="rope-floor"/>
  <div className="rope-status" aria-hidden="true">{outcome==='success'?'✦':outcome==='failed'?'':'✧'}</div>
 </div>;
}
