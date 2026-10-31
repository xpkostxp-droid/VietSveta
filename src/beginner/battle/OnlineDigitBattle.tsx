import { useEffect, useRef, type CSSProperties } from 'react';
import type { Match } from '../../battle/battleTypes';
import { useBattleResultSound } from '../../battle/useBattleResultSound';
import { playBattleDigit } from '../../battle/resultAudio';
import { GameChoices, beginnerPlayClass } from '../components/BeginnerPlayLayout';
import { DigitBattleStage } from './DigitBattleScreen';
import { onlineDigitSnapshot } from './onlineDigits';
import type { makeGameSound } from '../components/gameSounds';
export function OnlineDigitBattle({match,now,busy,locked,error,sound,onAnswer,onBack,onReplay,onStatistics}:{match:Match;now:number;busy:boolean;locked:boolean;error:string;sound:ReturnType<typeof makeGameSound>;onAnswer:(digit:number)=>void;onBack:()=>void;onReplay:()=>void;onStatistics:()=>void}) {
 const state = onlineDigitSnapshot(match,now), spoken=useRef(0),heard=useRef(-1),beeped=useRef(''),voice=useRef<()=>void>(()=>{});
 const finished=state.phase==='finished',resolved=finished||state.phase==='result';
 const ownName=match.side==='host'?match.host_name:match.guest_name,otherName=match.side==='host'?match.guest_name:match.host_name;
 const remaining=Math.max(0,(state.startsAt+(state.phase==='ready'?0:5000))-now),seconds=Math.ceil(remaining/1000);
 useBattleResultSound(finished?match.id:null,finished?(state.cubes.human.length>state.cubes.bot.length?'victory':'defeat'):null);
 useEffect(()=>{
  if(finished){voice.current();return;}
  if(state.phase==='question'&&spoken.current!==state.round){spoken.current=state.round;voice.current();voice.current=playBattleDigit(state.digit);}
 },[state.phase,state.round,state.digit,finished]);
 useEffect(()=>()=>voice.current(),[]);
 useEffect(()=>{
  if(!resolved&&seconds>=1&&seconds<=3){const key=`${state.round}:${state.phase}:${seconds}`;if(beeped.current!==key){beeped.current=key;sound.beep(seconds);}}
  if(resolved&&heard.current!==state.round){heard.current=state.round;if(!state.winner)sound.pop();else if(!finished)sound.beep(2);}
 },[state.round,state.phase,seconds,resolved,finished,sound]);
 return <div className={'screen '+beginnerPlayClass+' digit-battle-screen'}>
  <header className="digit-battle-header"><button className="digit-back" onClick={onBack} aria-label="К батлам">←</button><strong>Раунд {state.round}</strong><span className="digit-battle-clock" aria-label="Время на ответ" style={{'--clock-progress':`${resolved?0:state.phase==='ready'?100:remaining/50}%`} as CSSProperties}>{resolved?'✓':Number.isFinite(seconds)?seconds:'…'}</span></header>
  <DigitBattleStage state={state} now={now} opponentName={otherName}/>
  <div className="digit-score" aria-label="Счёт"><span><i/><span title={ownName}>{ownName}</span><strong>{state.cubes.human.length}</strong></span><span><i/><span title={otherName}>{otherName}</span><strong>{state.cubes.bot.length}</strong></span></div>
  <div className="digit-feedback" aria-hidden="true"/>
  <div className="digit-keypad-slot"><GameChoices count={10} columns={3} rows={4} className="digit-keypad" label="Телефонная клавиатура">{[1,2,3,4,5,6,7,8,9,0].map(digit=><button key={digit} className={(digit===0?'digit-key-zero ':'')+(resolved&&digit===state.digit?'digit-key-correct':'')} disabled={state.phase!=='question'||state.humanAnswered||locked||busy} onClick={()=>onAnswer(digit)}>{digit}</button>)}</GameChoices>
  {finished&&now>=state.resultAt+700&&<div className="digit-replay"><div className="digit-online-actions"><button className="big-button" disabled={busy} onClick={onReplay}>Реванш</button><button className="battle-return-button" onClick={onStatistics}>К статистике</button></div></div>}
  {error&&<p className="digit-online-error" role="alert">{error}</p>}
  </div>
 </div>;
}
