import { useState } from 'react';
import { BackButton } from './BackButton';
import { activeParticipant, leaderboardRows, participants, ratingGames, selectParticipant } from '../domain/leaderboard';
import './LeaderboardScreen.css';
export function LeaderboardScreen({onBack,onPlay}:{onBack:()=>void;onPlay:()=>void}) {
 const [game,setGame]=useState(ratingGames[0]);
 const [player,setPlayer]=useState(activeParticipant);
 return <div className="screen rating-screen">
  <BackButton onClick={onBack} label="На главную"/>
  <h1 className="screen-title">🏆 Рейтинг группы</h1>
  <p className="rating-note">Пробная таблица · результаты на этом устройстве</p>
  <label className="rating-player">Кто играет?<select value={player} onChange={e=>{setPlayer(e.target.value);selectParticipant(e.target.value);}}><option value="">Выбрать участника</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
  <div className="rating-tabs" role="group" aria-label="Рейтинг игры">{ratingGames.map(g=><button key={g.id} aria-pressed={g.id===game.id} onClick={()=>setGame(g)}>{g.name}</button>)}</div>
  <div className="rating-table-wrap"><table className="rating-table">
   <caption>{game.name} · {game.total} заданий</caption>
   <thead><tr><th scope="col">Место</th><th scope="col">Участник</th><th scope="col">Результат</th></tr></thead>
   <tbody>{leaderboardRows(game.id).map(p=><tr key={p.id} className={p.id===player?'rating-current':''}><td>{p.rank===1?'🥇':p.rank===2?'🥈':p.rank===3?'🥉':p.rank??'—'}</td><th scope="row">{p.name}</th><td>{p.record?<><strong>{p.record.correct} из {game.total}</strong><small>{(p.record.correctTimeMs!/1000).toFixed(2).replace('.',',')} сек</small></>:<span className="rating-empty">Ещё не играл</span>}</td></tr>)}</tbody>
  </table></div>
  <p className="rating-note">Выше тот, у кого больше правильных ответов. При равенстве — кто быстрее.</p>
  <button className="big-button rating-play" onClick={onPlay}>Играть →</button>
  {!player&&<p className="rating-note">Выбери участника, чтобы сохранить результат в таблице. Обучение в рейтинг не входит.</p>}
 </div>;
}
