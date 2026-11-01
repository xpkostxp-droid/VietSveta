import {useEffect,useState,type ReactNode} from 'react';
import {BackButton} from './BackButton';
import {memberRequest} from '../domain/cloud';
import {participantActivity,difficultWords,studyTopicTitle,studyTime,studyDate,type AdminStudyData,type StudyParticipant,type DifficultWord} from '../domain/adminStudy';
import {savedStudy,attemptSummary} from '../domain/savedStudy';
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
const directionTitle=(value:string)=>value==='ru-vi'?'Русский → вьетнамский':value==='vi-ru'?'Вьетнамский → русский':'На слух';
const courseTitle=(course:string)=>course==='beginner'?'Начальная группа':'Продвинутая группа';
function SavedWords({data,user}:{data:AdminStudyData;user:string}){
 const saved=savedStudy(data,user),[all,setAll]=useState(false);
 return <>
  {saved.errors.length>0&&<Fold title="Ошибки в сохранённых карточках" caption={`${saved.errors.length} записей · за всё время`}>
   <p className="study-caption">Накопленные самооценки карточек. Они не складываются с новыми подробными ответами ниже, чтобы не считать одно занятие дважды.</p>
   {(all?saved.errors:saved.errors.slice(0,10)).map(c=><div className="study-row" key={c.key}><span><strong>{c.vi}</strong><small>{c.ru}</small><small>{courseTitle(c.course)} · {c.lesson.replace('lesson-','урок ')} · {directionTitle(c.direction)}</small><small>Последний ответ: {c.lastResult==='remembered'?'вспомнил':'не вспомнил'}{c.lastReviewedAt?' · '+studyDate(c.lastReviewedAt):''}</small></span><span className="study-number">{c.missed} / {c.missed+c.remembered}<small>не вспомнил / ответы</small></span></div>)}
   {saved.errors.length>10&&<button className="study-more" onClick={()=>setAll(v=>!v)}>{all?'Первые 10 записей':`Все ошибки карточек · ${saved.errors.length}`}</button>}
  </Fold>}
  {saved.market.length>0&&<Fold title="Слова на повторение из игр" caption={`${saved.market.length} слов · сохранённый список`}><p className="study-caption">Овощи и фрукты. Сохранился список слов для повторения; частота и даты ошибок раньше не записывались.</p>{saved.market.map(w=><div className="study-row" key={w.vi}><strong>{w.vi}</strong><span>{w.ru}</span></div>)}</Fold>}
 </>;
}
function SavedProgress({data,user}:{data:AdminStudyData;user:string}){
 const saved=savedStudy(data,user);
 if(!saved.cards.length&&!saved.theory.length&&!saved.bests.length)return null;
 return <Fold title="Накопленный прогресс" caption="Карточки, теория и личные рекорды · за всё время">
  {saved.cards.length>0&&<><div className="study-row"><span>Карточек отработано</span><strong>{saved.unique}</strong></div><div className="study-row"><span>Карточек на повторение</span><strong>{saved.repeat}</strong></div><div className="study-row"><span>Самооценок «Вспомнил»</span><strong>{saved.cards.reduce((n,c)=>n+c.remembered,0)}</strong></div><div className="study-row"><span>Самооценок «Не вспомнил»</span><strong>{saved.cards.reduce((n,c)=>n+c.missed,0)}</strong></div></>}
  {saved.theory.length>0&&<Fold title="Открытые уроки теории" caption={`${saved.theory.length} уроков`}>{[...saved.theory].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).map(t=><div className="study-row" key={t.key}><span>{t.lesson.replace('lesson-','Урок ')}<small>{courseTitle(t.course)}</small></span><span>{studyDate(t.at)}</span></div>)}<p className="study-caption">Последнее открытие каждого урока. Открытие не означает, что урок прочитан или выучен.</p></Fold>}
  {saved.bests.length>0&&<Fold title="Сохранённые личные рекорды" caption={`${saved.bests.length} игр`}>{saved.bests.map((b,i)=><div className="study-row" key={b.game+':'+i}><span>{studyTopicTitle(b.game)}</span><strong>{b.record.correct} правильных{typeof b.record.correctTimeMs==='number'&&Number.isFinite(b.record.correctTimeMs)&&<small>{(b.record.correctTimeMs/1000).toFixed(2).replace('.',',')} сек</small>}</strong></div>)}<p className="study-caption">Включая прежние версии игр. Рекорд не считается дополнительной попыткой или медалью.</p></Fold>}
  <p className="study-caption">Это накопленные данные из сохранённого прогресса. Фильтр периода сверху на них не влияет.</p>
 </Fold>;
}
function Player({data,p}:{data:AdminStudyData;p:StudyParticipant}){
 const a=participantActivity(data,p.user_id),attempts=data.attempts.filter(x=>x.user_id===p.user_id),medals=data.medals.filter(x=>x.user_id===p.user_id),saved=savedStudy(data,p.user_id),summary=attemptSummary(attempts);
 const [historyAll,setHistoryAll]=useState(false),[day,setDay]=useState('all');
 const dayRows=day==='all'?a.rows:a.rows.filter(r=>r.day===day),dayAttempts=attempts.filter(t=>day==='all'||new Date(Date.parse(t.created_at)+7*3600000).toISOString().slice(0,10)===day);
 const daySummary=attemptSummary(dayAttempts);
 const topics=[...new Set([...dayRows.filter(r=>r.category==='games').map(r=>r.topic),...dayAttempts.map(t=>t.game)])];
 const counts=[1,2,3].map(place=>medals.filter(m=>m.place===place).length),errors=difficultWords(data,p.user_id).length,hasWords=data.words.some(w=>w.user_id===p.user_id);
 const days=[...new Set([...a.rows.filter(r=>r.active_ms>0).map(r=>r.day),...attempts.map(t=>new Date(Date.parse(t.created_at)+7*3600000).toISOString().slice(0,10))])].sort().reverse();
 const last=[a.coverage?.last_seen,saved.last,...attempts.map(t=>t.created_at)].filter((d):d is string=>!!d).sort((x,y)=>Date.parse(y)-Date.parse(x))[0];
 const hasActivity=a.total>0||attempts.length>0;
 return <Fold id={'study-player-'+p.id} title={p.display_name} caption={[attempts.length?`${attempts.length} попыток игр`:null,saved.unique?`${saved.unique} карточек за всё время`:null,saved.theory.length?`${saved.theory.length} уроков теории`:null,saved.bests.length?`${saved.bests.length} личных рекордов`:null,medals.length?`🥇 ${counts[0]} · 🥈 ${counts[1]} · 🥉 ${counts[2]}`:null].filter(Boolean).join(' · ')||'Нет сохранённых занятий'} value={a.total>0?studyTime(a.total):attempts.length?`${attempts.length} игр`:'—'}>
  <p className="study-caption">{last?`Последнее сохранённое действие: ${studyDate(last)}`:'Данных о последней активности пока нет.'}{a.coverage&&<><br/>Точный учёт времени начат {studyDate(a.coverage.first_seen)}.</>}</p>
  {hasActivity&&<Fold title="Активность и игры" caption={`${attempts.length} попыток · ${summary.days} игровых дней${a.total>0?' · '+studyTime(a.total)+' измерено':''}`}>
   <select aria-label={'День занятий · '+p.display_name} value={day} onChange={e=>setDay(e.target.value)}><option value="all">Весь выбранный период</option>{days.map(d=><option key={d} value={d}>{new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Ho_Chi_Minh',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00+07:00'))}</option>)}</select>
   {[['games','Игры'],['cards','Карточки'],['audio','Аудирование'],['theory','Просмотр теории']].map(([category,title])=>{const ms=dayRows.filter(r=>r.category===category).reduce((n,r)=>n+Number(r.active_ms),0);return ms>0?<div className="study-row" key={category}><span>{title} · измеренное время</span><strong>{studyTime(ms)}</strong></div>:null;})}
   {daySummary.correctMs>0&&<p className="study-caption">Время правильных ответов в сохранённых играх за период: {studyTime(daySummary.correctMs)}. Это часть времени игры, а не длительность занятий.</p>}
   <h3>В какие игры</h3>{topics.map(topic=>{const gameAttempts=dayAttempts.filter(t=>t.game===topic),g=attemptSummary(gameAttempts),ms=dayRows.filter(r=>r.category==='games'&&r.topic===topic).reduce((n,r)=>n+Number(r.active_ms),0);return <div className="study-row" key={topic}><span>{studyTopicTitle(topic)}{g.count>0&&<small>Попыток: {g.count} · правильных ответов: {g.correct} из {g.total}</small>}{g.correctMs>0&&<small>Время правильных ответов: {studyTime(g.correctMs)}</small>}</span>{ms>0&&<strong className="study-number">{studyTime(ms)}<small>измерено</small></strong>}</div>;})}
  </Fold>}
  <SavedProgress data={data} user={p.user_id}/>
  {(hasWords||saved.errors.length>0||saved.market.length>0)&&<Fold title="Трудные слова" caption={errors?`${errors} слов с ошибками за период`:saved.errors.length||saved.market.length?'Есть сохранённые слова на повторение':'Есть ответы за период'}><SavedWords data={data} user={p.user_id}/>{hasWords&&<><h3>Подробные ответы за выбранный период</h3><Words data={data} user={p.user_id}/></>}</Fold>}
  {medals.length>0&&<Fold title="Призовые места" caption={`🥇 ${counts[0]} · 🥈 ${counts[1]} · 🥉 ${counts[2]}`}>
   {[1,2,3].filter(place=>counts[place-1]>0).map(place=><section key={place}><h3>{['🥇 Золото','🥈 Серебро','🥉 Бронза'][place-1]} · {counts[place-1]}</h3>{medals.filter(m=>m.place===place).map(m=><div className="study-row" key={m.game}><span>{studyTopicTitle(m.game)}</span><span className="study-number">{m.correct} из {m.total}<small>{(m.correct_time_ms/1000).toFixed(2).replace('.',',')} сек</small></span></div>)}</section>)}<p className="study-caption">Текущие места в рейтингах за всё время, с учётом одинаковых результатов. Период сверху на медали не влияет.</p>
  </Fold>}
  {attempts.length>0&&<Fold title="История игр" caption={`${attempts.length} попыток за период`}>
   {(historyAll?attempts:attempts.slice(0,10)).map(t=><div className="study-row" key={t.id}><span>{studyTopicTitle(t.game)}<small>{studyDate(t.created_at)}</small></span><span className="study-number">{t.correct} из {t.total}<small>{(t.correct_time_ms/1000).toFixed(2).replace('.',',')} сек · правильные ответы</small></span></div>)}{attempts.length>10&&<button className="study-more" onClick={()=>setHistoryAll(x=>!x)}>{historyAll?'Свернуть':'Все попытки · '+attempts.length}</button>}
  </Fold>}
 </Fold>;
}
export default function AdminStudyStatistics({isAdmin,onBack}:{isAdmin:boolean;onBack:()=>void}){
 const [days,setDays]=useState(0),[sort,setSort]=useState('games'),[data,setData]=useState<AdminStudyData|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!isAdmin)return;let alive=true;setBusy(true);setError('');setData(null);void memberRequest({action:'admin-study-stats',days}).then((next:AdminStudyData)=>{if(!Array.isArray(next.participants)||!Array.isArray(next.activity)||!Array.isArray(next.words)||!Array.isArray(next.medals)||!Array.isArray(next.attempts)||!Array.isArray(next.coverage))throw new Error('Invalid statistics');if(alive)setData(next);}).catch(()=>{if(alive)setError('Не удалось загрузить статистику. Проверь подключение и попробуй ещё раз.');}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[days,retry,isAdmin]);
 if(!isAdmin)return <div className="screen"><BackButton onClick={onBack}/><p role="alert">Статистика доступна только администратору.</p></div>;
 const gameCount=(user:string)=>data?.attempts.filter(a=>a.user_id===user).length??0;
 const list=data?[...data.participants].sort((a,b)=>(sort==='time'?participantActivity(data,b.user_id).total-participantActivity(data,a.user_id).total:gameCount(b.user_id)-gameCount(a.user_id))||a.display_name.localeCompare(b.display_name)):[];
 const total=data?data.activity.filter(a=>a.category!=='visit').reduce((n,r)=>n+Number(r.active_ms),0):0;
 const active=data?list.filter(p=>gameCount(p.user_id)>0).length:0;
 return <div className="screen admin-study"><BackButton onClick={onBack} label="К профилю администратора"/><h1 className="screen-title">Статистика</h1><div className="study-toolbar"><div className="study-period" role="group" aria-label="Период статистики">{[[0,'Всё время'],[1,'Сегодня'],[7,'7 дней'],[30,'30 дней']].map(([value,title])=><button key={value} aria-pressed={days===value} onClick={()=>setDays(Number(value))}>{title}</button>)}</div><button className="secondary-button study-refresh" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Обновить</button></div>
  {busy&&<p role="status">Загружаем статистику…</p>}{error&&<p className="study-error-message" role="alert">{error}</p>}
  {data&&<><p className="study-caption">По времени Вьетнама · обновлено {studyDate(data.generated_at)}</p><Fold title="Активность группы" caption={`${data.attempts.length} сохранённых попыток игр · играли ${active} из ${list.length}`} value={total>0?studyTime(total):undefined}>
   <div className="study-filters" role="group" aria-label="Порядок участников"><button aria-pressed={sort==='games'} onClick={()=>setSort('games')}>По играм</button><button aria-pressed={sort==='time'} onClick={()=>setSort('time')}>По измеренному времени</button></div>
   <table className="study-table"><thead><tr><th>№</th><th>Участник</th><th>Игры</th><th>Время</th></tr></thead><tbody>{list.map((p,i)=>{const a=participantActivity(data,p.user_id),saved=savedStudy(data,p.user_id),games=gameCount(p.user_id);return <tr key={p.id}><td>{(sort==='time'?a.total:games)>0?i+1:'—'}</td><td><button className="study-name-link" onClick={()=>{const target=document.getElementById('study-player-'+p.id) as HTMLDetailsElement|null;if(target)target.open=true;}}>{p.display_name}
    {saved.unique>0&&<small className="study-caption" style={{display:'block'}}>Карточек: {saved.unique} · за всё время</small>}
    {saved.theory.length>0&&<small className="study-caption" style={{display:'block'}}>Теория: {saved.theory.length} уроков · за всё время</small>}
    {a.total>0&&<small className="study-table-split">{[['games','Игры'],['cards','Карточки'],['audio','Аудио'],['theory','Теория']].map(([c,label])=>{const ms=a.rows.filter(r=>r.category===c).reduce((n,r)=>n+Number(r.active_ms),0);return ms>0?<span key={c}>{label}: {studyTime(ms)}</span>:null;})}</small>}
   </button></td><td>{games||'—'}</td><td>{a.total>0?studyTime(a.total):'—'}</td></tr>;})}</tbody></table><p className="study-caption">Место по числу попыток или измеренному времени. Прочерк — данных нет. Карточки и теория показывают накопленный прогресс за всё время.</p>
  </Fold><p className="study-section-label">УЧАСТНИКИ · {sort==='games'?'ПО ЧИСЛУ ИГР':'ПО ИЗМЕРЕННОМУ ВРЕМЕНИ'}</p>{list.map(p=><Player key={p.id+':'+days} data={data} p={p}/>)}<p className="study-caption">Старые результаты игр, карточки, списки повторения и открытые уроки взяты из сохранённых данных. Время правильных ответов не заменяет полное время занятий. Точный учёт длительности и подробных ответов начат с обновления приложения у участника; отсутствующие замеры не восстанавливаем приблизительно.<br/>Активное время исключает свёрнутое приложение и бездействие дольше минуты. Просмотр теории не подтверждает чтение. Отправка фоновых данных — примерно раз в 30 секунд при наличии сети.</p></>}
 </div>;
}
