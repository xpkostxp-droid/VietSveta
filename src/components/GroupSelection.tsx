import {lazy,Suspense} from 'react';
import type {ProfileGameId} from '../domain/profileGames';
const OverallRanking=lazy(()=>import('./OverallRanking'));
import { BackButton } from './BackButton';
export type CourseSection = 'games' | 'listening' | 'theory' | 'cards';
const titles: Record<CourseSection,string> = {games:'Игры',listening:'Аудирование',theory:'Теория',cards:'Карточки'};
export function GroupSelection({section,onBack,onChoose,preferredGroup='advanced',onOpenBots,onOpenRankedGame}:{onOpenRankedGame?:(game:ProfileGameId)=>void;onOpenBots?:()=>void;preferredGroup?:'beginner'|'advanced';section:CourseSection;onBack:()=>void;onChoose:(group:'beginner'|'advanced')=>void}) {
 return <div className="screen"><BackButton onClick={onBack} label="На главную"/><h1 className="screen-title">{titles[section]}</h1><div className="market-options" style={{gap:18}}><button className={'big-button group-choice'+(preferredGroup==='beginner'?' group-preferred':'')} aria-current={preferredGroup==='beginner'?'true':undefined} style={{minHeight:90,fontSize:'1.3rem',fontWeight:800}} onClick={()=>onChoose('beginner')}>Начальная группа</button><button className={'big-button group-choice'+(preferredGroup==='advanced'?' group-preferred':'')} aria-current={preferredGroup==='advanced'?'true':undefined} style={{minHeight:90,fontSize:'1.3rem',fontWeight:800}} onClick={()=>onChoose('advanced')}>Продвинутая группа</button>{section==='games'&&onOpenBots&&<button className="big-button group-choice" style={{minHeight:90,fontSize:'1.3rem',fontWeight:800}} onClick={onOpenBots}>Игра с ботами</button>}</div>{section==='games'&&onOpenRankedGame&&<Suspense fallback={<p role="status">Загружаем рейтинг…</p>}><OverallRanking onOpenGame={onOpenRankedGame}/></Suspense>}</div>;
}
