import {useEffect,useState,type ReactNode} from 'react';
import {BackButton} from './BackButton';
import {memberRequest} from '../domain/cloud';
import {participantActivity,difficultWords,studyTopicTitle,studyTime,studyDate,type AdminStudyData,type StudyParticipant,type DifficultWord} from '../domain/adminStudy';
import './AdminStudyStatistics.css';
function Fold({title,caption,value,children,id}:{title:string;caption?:string;value?:ReactNode;children:ReactNode;id?:string}){
 return <details id={id} onToggle={e=>{const self=e.currentTarget;if(self.open)for(const other of Array.from(self.parentElement?.children??[]))if(other instanceof HTMLDetailsElement&&other!==self)other.open=false;}}><summary><div><strong>{title}</strong>{caption&&<small>{caption}</small>}</div><span className="study-summary-right">{value}<span className="study-chevron" aria-hidden="true">⌄</span></span></summary><div className="study-body">{children}</div></details>;
}
function WordDetails({word:w,slow}:{word:DifficultWord;slow:boolean}){
 const seconds=w.correct?(w.correctMs/w.correct/1000).toFixed(1).replace('.',','):null;
 return <details onToggle={e=>{const self=e.currentTarget;if(self.open)for(const other of Array.from(self.parentElement?.children??[]))if(other instanceof HTMLDetailsElement&&other!==self)other.open=false;}}><summary><div><strong>{w.vi}</strong><small>{w.ru} · {studyTopicTitle(w.topic)}</small><div className="study-history" aria-label={'Последние ответы: '+w.recent.map(r=>r.result==='correct'?'правильно':r.result==='timeout'?'время вышло':'ошибка').join(', ')}>{w.recent.map((r,i)=><span key={i} aria-hidden="true" className={r.result==='correct'?'study-correct':'study-error'}>{r.result==='correct'?'✓':r.result==='timeout'?'◷':'✕'}</span>)}</div></div><span className="study-summary-right"><span className="study-number">{slow?`${seconds} сек`:`${w.errors} / ${w.shows}`}<small>{w.shows<5?'Мало данных':slow?'правильный ответ':`${Math.round(w.errors/w.shows*100)}% ошибок`}</small></span><span className="study-chevron" aria-hidden="true">⌄</span></span></summary><div className="study-word-detail">
  {w.topic.startsWith('cards:')&&<p className="study-caption">Карточки: самооценка «Вспомнил / Не вспомнил».</p>}
  {w.directions.map(d=><div key={d.direction} className="study-row"><span>{d.direction==='ru-vi'?'Русский → вьетнамский':d.direction==='vi-ru'?'Вьетнамский → русский':'На слух'}</span><span>Ошибок: {d.errors} из {d.shows}</span></div>)}
  {w.confusions.slice(0,3).map(c=><div className="study-row" key={c.chosen}><span>Выбирает «{c.chosen}»</span><span>{c.count} раз</span></div>)}
  <div className="study-row"><span>Неверный выбор / не вспомнил</span><span>{w.errors-w.timeouts}</span></div><div className="study-row"><span>Время вышло</span><span>{w.timeouts}</span></div><div className="study-row"><span>Правильный ответ в среднем</span><span>{seconds?seconds+' сек':'Нет правильных ответов'}</span></div><div className="study-row"><span>Последняя ошибка</span><span>{w.lastError?studyDate(w.lastError):'—'}</span></div>
 </div></details>;
}
function Words({data,user}:{data:AdminStudyData;user:string}){
 const [mode,setMode]=useState('errors'),[topic,setTopic]=useState('all'),[all,setAll]=useState(false);
 const topics=[...new Set(data.words.filter(w=>w.user_id===user).map(w=>w.topic))];
 const words=difficultWords(data,user,topic,mode),shown=all?words:words.slice(0,10);
 return <><div className="study-filters" role="group" aria-label="Какие слова">{[['errors','Часто ошибается'],['slow','Долго думает'],['fixed','Уже исправил']].map(([id,title])=><button key={id} aria-pressed={mode===id} onClick={()=>{setMode(id);setAll(false);}}>{title}</button>)}</div>
  <select aria-label="Тема игры" value={topic} onChange={e=>{setTopic(e.target.value);setAll(false);}}><option value="all">Все игры и карточки</option>{topics.map(t=><option key={t} value={t}>{studyTopicTitle(t)}</option>)}</select>
  <p className="study-caption">{shown.length} из {words.length} слов · {mode==='slow'?'среднее время правильного ответа в играх':'ошибки / показы'}</p>
  {words.length===0?<p className="study-caption">За этот период подходящих ответов пока нет. Новые данные появятся после занятий в обновлённом приложении.</p>:<div>{shown.map(w=><WordDetails key={w.key} word={w} slow={mode==='slow'}/>)}</div>}
  {words.length>10&&<button className="study-more" onClick={()=>setAll(a=>!a)}>{all?'Свернуть до 10 слов':`Все слова · ${words.length}`}</button>}
  <p className="study-caption">✓ правильно · ✕ ошибка · ◷ время вышло. Справа — самый свежий ответ. В начале списка — слова с 5 показами и более.</p>
 </>;
}
function Player({data,p}:{data:AdminStudyData;p:StudyParticipant}){
 const a=participantActivity(data,p.user_id),attempts=data.attempts.filter(x=>x.user_id===p.user_id),medals=data.medals.filter(x=>x.user_id===p.user_id);
 const [historyAll,setHistoryAll]=useState(false),[day,setDay]=useState('all');
 const dayRows=day==='all'?a.rows:a.rows.filter(r=>r.day===day),gameMap=new Map<string,number>();
 for(const row of dayRows.filter(r=>r.category==='games'))gameMap.set(row.topic,(gameMap.get(row.topic)??0)+Number(row.active_ms));
 const counts=[1,2,3].map(place=>medals.filter(m=>m.place===place).length),errors=difficultWords(data,p.user_id).length;
 const days=[...new Set(a.rows.filter(r=>r.active_ms>0).map(r=>r.day))].sort().reverse();
 const last=a.coverage?.last_seen??attempts[0]?.created_at;
 return <Fold id={'study-player-'+p.id} title={p.display_name} caption={a.coverage?(a.total?`${a.days} дн. занятий`:'Нет измеренных занятий за период'):'Нет новых данных учёта'} value={a.coverage?studyTime(a.total):'—'}>
  <p className="study-caption">{last?`Последняя активность: ${studyDate(last)}`:'Последняя активность пока неизвестна.'}<br/>{a.coverage?`Учёт начат ${studyDate(a.coverage.first_seen)}.`:'На устройстве участника ещё нет данных из обновлённого приложения.'}</p>
  <Fold title="Активность и игры" caption={a.coverage?studyTime(a.total)+' за период':'Время ещё не измерялось'}>
   <select aria-label={'День занятий · '+p.display_name} value={day} onChange={e=>setDay(e.target.value)}><option value="all">Весь выбранный период</option>{days.map(d=><option key={d} value={d}>{new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Ho_Chi_Minh',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00+07:00'))}</option>)}</select>
   {a.coverage?[['games','Игры'],['cards','Карточки'],['audio','Аудирование'],['theory','Просмотр теории']].map(([category,title])=><div className="study-row" key={category}><span>{title}</span><span className="study-number">{studyTime(dayRows.filter(r=>r.category===category).reduce((n,r)=>n+Number(r.active_ms),0))}</span></div>):<p className="study-caption">Историческое время не восстанавливаем по результатам игр.</p>}
   <h3>В какие игры</h3>{[...gameMap.entries()].sort((a,b)=>b[1]-a[1]).map(([topic,ms])=><div className="study-row" key={topic}><span>{studyTopicTitle(topic)}<small>Завершённых попыток: {attempts.filter(t=>t.game===topic&&(day==='all'||new Date(Date.parse(t.created_at)+7*3600000).toISOString().slice(0,10)===day)).length}</small></span><span className="study-number">{studyTime(ms)}</span></div>)}{!gameMap.size&&<p className="study-caption">Нет измеренного времени игр за выбранный период.</p>}
  </Fold>
  <Fold title="Трудные слова" caption={errors?`${errors} слов с ошибками`:'Пока нет данных об ошибках'}><Words data={data} user={p.user_id}/></Fold>
  <Fold title="Призовые места" caption={`🥇 ${counts[0]} · 🥈 ${counts[1]} · 🥉 ${counts[2]}`}>
   {[1,2,3].map(place=><section key={place}><h3>{['🥇 Золото','🥈 Серебро','🥉 Бронза'][place-1]} · {counts[place-1]}</h3>{medals.filter(m=>m.place===place).map(m=><div className="study-row" key={m.game}><span>{studyTopicTitle(m.game)}</span><span className="study-number">{m.correct} из {m.total}<small>{(m.correct_time_ms/1000).toFixed(2).replace('.',',')} сек</small></span></div>)}</section>)}<p className="study-caption">Текущие места в рейтингах за всё время, с учётом одинаковых результатов. Период сверху на медали не влияет.</p>
  </Fold>
  <Fold title="История игр" caption={`${attempts.length} попыток за период`}>
   {(historyAll?attempts:attempts.slice(0,10)).map(t=><div className="study-row" key={t.id}><span>{studyTopicTitle(t.game)}<small>{studyDate(t.created_at)}</small></span><span className="study-number">{t.correct} из {t.total}<small>{(t.correct_time_ms/1000).toFixed(2).replace('.',',')} сек · правильные ответы</small></span></div>)}{attempts.length===0&&<p className="study-caption">Нет сохранённых попыток за выбранный период.</p>}{attempts.length>10&&<button className="study-more" onClick={()=>setHistoryAll(x=>!x)}>{historyAll?'Свернуть':'Все попытки · '+attempts.length}</button>}
  </Fold>
 </Fold>;
}
export default function AdminStudyStatistics({isAdmin,onBack}:{isAdmin:boolean;onBack:()=>void}){
 const [days,setDays]=useState(7),[data,setData]=useState<AdminStudyData|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!isAdmin)return;let alive=true;setBusy(true);setError('');setData(null);void memberRequest({action:'admin-study-stats',days}).then((next:AdminStudyData)=>{if(!Array.isArray(next.participants)||!Array.isArray(next.activity)||!Array.isArray(next.words)||!Array.isArray(next.medals)||!Array.isArray(next.attempts)||!Array.isArray(next.coverage))throw new Error('Invalid statistics');if(alive)setData(next);}).catch(()=>{if(alive)setError('Не удалось загрузить статистику. Проверь подключение и попробуй ещё раз.');}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[days,retry,isAdmin]);
 if(!isAdmin)return <div className="screen"><BackButton onClick={onBack}/><p role="alert">Статистика доступна только администратору.</p></div>;
 const list=data?[...data.participants].sort((a,b)=>participantActivity(data,b.user_id).total-participantActivity(data,a.user_id).total||a.display_name.localeCompare(b.display_name)):[];
 const total=data?data.activity.filter(a=>a.category!=='visit').reduce((n,r)=>n+Number(r.active_ms),0):0;
 const active=data?list.filter(p=>participantActivity(data,p.user_id).total>0).length:0;
 return <div className="screen admin-study"><BackButton onClick={onBack} label="К профилю администратора"/><h1 className="screen-title">Статистика</h1><div className="study-toolbar"><div className="study-period" role="group" aria-label="Период статистики">{[[1,'Сегодня'],[7,'7 дней'],[30,'30 дней']].map(([value,title])=><button key={value} aria-pressed={days===value} onClick={()=>setDays(Number(value))}>{title}</button>)}</div><button className="secondary-button study-refresh" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Обновить</button></div>
  {busy&&<p role="status">Загружаем статистику…</p>}{error&&<p className="study-error-message" role="alert">{error}</p>}
  {data&&<><p className="study-caption">По времени Вьетнама · обновлено {studyDate(data.generated_at)}</p><Fold title="Активность группы" caption={`Занимались ${active} из ${list.length} · только измеренное время`} value={studyTime(total)}>
   <table className="study-table"><thead><tr><th>№</th><th>Участник</th><th>Время</th></tr></thead><tbody>{list.map((p,i)=>{const a=participantActivity(data,p.user_id);return <tr key={p.id}><td>{a.total?i+1:'—'}</td><td><button className="study-name-link" onClick={()=>{const target=document.getElementById('study-player-'+p.id) as HTMLDetailsElement|null;if(target)target.open=true;}}>{p.display_name}<small className="study-caption" style={{display:'block'}}>{a.coverage?`${a.days} из ${days} дней`:'Нет новых данных'}</small>{a.coverage&&<small className="study-table-split">{[['games','Игры'],['cards','Карточки'],['audio','Аудио'],['theory','Теория']].map(([c,label])=><span key={c}>{label}: {studyTime(a.rows.filter(r=>r.category===c).reduce((n,r)=>n+Number(r.active_ms),0))}</span>)}</small>}</button></td><td>{a.coverage?studyTime(a.total):'—'}</td></tr>;})}</tbody></table><p className="study-caption">Это место по активности, а не медаль за результат игры.</p>
  </Fold><p className="study-section-label">УЧАСТНИКИ · ПО ВРЕМЕНИ ЗАНЯТИЙ</p>{list.map(p=><Player key={p.id+':'+days} data={data} p={p}/>)}<p className="study-caption">Точное время и ответы по словам собираются с установки этого обновления на телефон участника. Отсутствие новых данных не означает отсутствие занятий. История результатов и медали доступны по ранее сохранённым попыткам.<br/>Активное время исключает свёрнутое приложение и бездействие дольше минуты. Просмотр теории не подтверждает чтение. Отправка фоновых данных — примерно раз в 30 секунд при наличии сети.</p></>}
 </div>;
}
