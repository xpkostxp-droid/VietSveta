import { TopicWheel } from '../../battle/TopicWheel';
import { useBattleResultSound } from '../../battle/useBattleResultSound';
import { readyBattleDigitAudio, playBattleDigit } from '../../battle/resultAudio';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BackButton } from '../components/BackButton';
import { GameChoices, beginnerPlayClass } from '../components/BeginnerPlayLayout';
import { makeGameSound } from '../components/gameSounds';
import { phoneDigitWords } from '../content/games/phone';
import { createDigitBattle, DIGIT_ROUND_MS, type DigitBattleState, type DigitSide } from './digitBattle';
import './DigitBattleScreen.css';
const keypad = [1,2,3,4,5,6,7,8,9,0];
function cubePosition(index: number, side: DigitSide) {
 return { '--cube-column': side === 'human' ? index % 2 : 1 - index % 2, '--cube-row': Math.floor(index / 2) } as CSSProperties;
}
export function DigitBattleStage({ state, now, paused = false, onResume, opponentName = 'Бот' }: { opponentName?: string; state: DigitBattleState; now: number; paused?: boolean; onResume?: () => void }) {
 const resolved = state.phase === 'result' || state.phase === 'finished';
 const showPrompt = state.phase === 'question' || (resolved && state.winner === null && now < state.resultAt + 180);
 const progress = Math.max(0, Math.min(1, ((resolved ? state.resultAt : now) - state.startsAt) / DIGIT_ROUND_MS));
 const style = { '--fall-y': `${12 + progress * 68}%` } as CSSProperties;
 return <div className="digit-glass" style={style} aria-label="Общий стакан">
  <div className="digit-glass-rim" aria-hidden="true"/>
  {(['human','bot'] as const).map(side => <div className={'digit-stack digit-stack-' + side} key={side} aria-label={side === 'human' ? 'Твои кубики' : 'Кубики соперника'}>
   {state.cubes[side].map((digit, i) => <div key={i} className="digit-small-cube digit-cube" style={cubePosition(i,side)}>{digit}</div>)}
  </div>)}
  {showPrompt && <div key={state.round} className={'digit-falling-cube digit-cube' + (resolved ? ' is-popping' : '')} lang="vi">{phoneDigitWords[state.digit]}</div>}
  {state.phase === 'ready' && state.round === 1 && <div className="digit-field-message"><strong>{Number.isFinite(state.startsAt)?Math.max(1,Math.ceil((state.startsAt-now)/1000)):'…'}</strong></div>}
  {state.phase === 'finished' && now >= state.resultAt + 700 && <div className="digit-field-message digit-victory"><strong>{state.winner === 'human' ? 'Ты победил!' : `${opponentName} победил`}</strong></div>}
  {paused && <div className="digit-pause"><strong>Пауза</strong><button className="big-button" onClick={onResume}>Продолжить</button></div>}
 </div>;
}
export function DigitBattleScreen({ onBack, playerName = 'Ты', showPicker = false }: { onBack: () => void; playerName?: string; showPicker?: boolean }) {
 const [playing,setPlaying] = useState(false), [session,setSession] = useState(0);
 const [sound] = useState(makeGameSound);
 useEffect(() => () => sound.close(), [sound]);
 const start = () => { sound.ready(); readyBattleDigitAudio(); setSession(n=>n+1); setPlaying(true); };
 if (!playing) return <div className={"screen digit-battle-intro"+(showPicker?" digit-battle-picker":"")}><BackButton onClick={onBack} label={showPicker?"К статистике":"К батлам"}/>{showPicker?<><h1 className="screen-title">Батл</h1><div className="battle-label">Выбери игру</div><TopicWheel items={[{id:'digits',title:'Цифры 0–9'}]} value="digits" onChange={()=>{}} label="Выбери игру"/></>:<><span className="badge">Батл · С ботом</span><h1>Батл · Цифры 0–9</h1></>}{showPicker?<p className="digit-picker-note">5 секунд на ответ · Победа при 8 кубиках</p>:<><p>Прочитай слово на падающем кубике и нажми цифру. Первый правильный ответ забирает кубик.</p><p>Собери 8 кубиков раньше бота. На каждый кубик — 5 секунд. После ошибки у соперника остаётся время.</p></>}<button className="big-button" onClick={start}>Сыграть с ботом</button><small>Тренировка · без рейтинга</small></div>;
 return <DigitBattleMatch key={session} playerName={playerName} sound={sound} onBack={showPicker?()=>setPlaying(false):onBack} onReplay={start}/>;
}
function DigitBattleMatch({ playerName, sound, onBack, onReplay }: { playerName: string; sound: ReturnType<typeof makeGameSound>; onBack: () => void; onReplay: () => void }) {
 const [game] = useState(createDigitBattle), [state,setState] = useState(game.initial), [now,setNow] = useState(Date.now), [paused,setPaused] = useState(document.hidden);
 const beeped = useRef(''), heard = useRef(0), spoken = useRef(0), stopVoice = useRef<() => void>(()=>{});
 useBattleResultSound(state.phase==='finished'?'digit-bot':null,state.phase==='finished'?(state.winner==='human'?'victory':'defeat'):null);
 useEffect(() => {
  if (paused || state.phase === 'finished') { stopVoice.current(); return; }
  if (state.phase !== 'question' || spoken.current === state.round) return;
  spoken.current = state.round; stopVoice.current();
  stopVoice.current = playBattleDigit(state.digit);
 }, [state.phase,state.round,state.digit,paused]);
 useEffect(()=>()=>stopVoice.current(),[]);
 useEffect(() => {
  if (paused) { game.pause(); return; }
  const timer = setInterval(() => { setState(game.poll()); setNow(Date.now()); }, 33);
  return () => clearInterval(timer);
 }, [game,paused]);
 useEffect(() => {
  const hide = () => { if (document.hidden) { setState(game.pause()); setNow(Date.now()); setPaused(true); } };
  document.addEventListener('visibilitychange',hide); return () => document.removeEventListener('visibilitychange',hide);
 }, [game]);
 const resolved = state.phase === 'result' || state.phase === 'finished';
 const seconds = Math.max(0,Math.ceil((state.startsAt + (state.phase === 'ready' ? 0 : DIGIT_ROUND_MS) - now)/1000));
 useEffect(() => {
  if (paused) return;
  const key = `${state.round}:${state.phase}:${seconds}`;
  if (!resolved && seconds >= 1 && seconds <= 3 && beeped.current !== key) { beeped.current = key; sound.beep(seconds); }
  if (resolved && heard.current !== state.round) { heard.current = state.round; if (!state.winner) sound.pop(); else if (state.phase !== 'finished') sound.beep(2); }
 }, [state.round,state.phase,seconds,paused,sound]);
 return <div className={'screen ' + beginnerPlayClass + ' digit-battle-screen'}>
  <header className="digit-battle-header"><button className="digit-back" onClick={onBack} aria-label="К батлам">←</button><strong>Раунд {state.round}</strong><span className="digit-battle-clock" aria-label="Время на ответ" style={{ '--clock-progress': `${paused || resolved ? 0 : state.phase === 'ready' ? 100 : Math.max(0,(state.startsAt+5000-now)/50)}%` } as CSSProperties}>{paused ? 'Ⅱ' : resolved ? '✓' : seconds}</span></header>
  <DigitBattleStage state={state} now={now} paused={paused} onResume={() => { sound.ready(); readyBattleDigitAudio(); setState(game.resume()); setNow(Date.now()); setPaused(false); }}/>
  <div className="digit-score" aria-label="Счёт"><span><i/ ><span title={playerName}>{playerName}</span><strong>{state.cubes.human.length}</strong></span><span><i/><span>Бот</span><strong>{state.cubes.bot.length}</strong></span></div>
  <div className="digit-feedback" aria-hidden="true"/>
  <div className="digit-keypad-slot"><GameChoices count={10} columns={3} rows={4} className="digit-keypad" label="Телефонная клавиатура">{keypad.map(digit=><button key={digit} className={(digit === 0 ? 'digit-key-zero ' : '') + (state.humanChoice === digit && digit !== state.digit ? 'digit-key-wrong ' : '') + (resolved && digit === state.digit ? 'digit-key-correct' : '')} disabled={paused || state.phase !== 'question' || state.humanAnswered} onClick={() => { setState(game.answer(digit,state.round)); setNow(Date.now()); }}>{digit}</button>)}</GameChoices>
   {state.phase === 'finished' && now >= state.resultAt + 1100 && <div className="digit-replay"><button className="big-button" onClick={onReplay}>Реванш с ботом</button></div>}
  </div>
 </div>;
}
