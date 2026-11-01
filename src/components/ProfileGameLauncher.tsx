import {lazy,Suspense} from 'react';
import type {ProfileGameId} from '../domain/profileGames';
import {MarketBlitzScreen} from './MarketBlitzScreen';
import {QuestionsBlitzScreen} from './QuestionsBlitzScreen';
import {AdjectiveTetris} from './AdjectiveTetris';
const VerbsGame=lazy(()=>import('./VerbsGameScreen'));
const BeginnerGame=lazy(()=>import('../beginner/components/ProfileBeginnerGame'));
export function ProfileGameLauncher({game,onBack,backLabel="К профилю"}:{game:ProfileGameId;onBack:()=>void;backLabel?:string}){
 if(game==='lesson15-verbs')return <Suspense fallback={<p role="status">Загружаем игру…</p>}><VerbsGame onBack={onBack}/></Suspense>;
 if(game.startsWith('lesson'))return <Suspense fallback={<div className="screen"><p role="status">Загружаем игру…</p><button className="account-back" onClick={onBack}>{backLabel}</button></div>}><BeginnerGame game={game} onBack={onBack}/></Suspense>;
 if(game==='harvest-fruits'||game==='harvest-vegetables')return <MarketBlitzScreen category={game==='harvest-fruits'?'fruits':'vegetables'} onBack={onBack}/>;
 if(game.startsWith('questions'))return <QuestionsBlitzScreen variant={game==='questions-15'?'basic':'super'} onBack={onBack}/>;
 return <AdjectiveTetris variant={game==='adjectives-rope'?'rope':game==='adjectives-cannon'?'cannon':'tetris'} onBack={onBack}/>;
}
