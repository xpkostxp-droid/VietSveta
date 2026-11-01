import {useEffect,useState} from 'react';
import {BackButton} from '../components/BackButton';
import {NinjaScreen} from '../ninja/NinjaScreen';
import type {NinjaTopic} from '../ninja/ninjaEngine';
import type {MemberGender} from '../domain/memberGender';
import {primeBattleSpeech} from './battleSpeech';
import {createBattleAudio,BotBattleScreen} from './BattleScreen';
import {botVocabulary} from './botVocabulary';
import {TopicWheel} from './TopicWheel';
export function AdminBattleLab({isAdmin,onBack,backLabel="К админке"}:{isAdmin:boolean;onBack:()=>void;backLabel?:string}){
 const [audio]=useState(createBattleAudio),[topic,setTopic]=useState('fruits'),[gender,setGender]=useState<MemberGender>('man'),[playing,setPlaying]=useState(false),[session,setSession]=useState(0);
 useEffect(()=>()=>{audio.sound.close();audio.court.close();audio.ninja.close();},[audio]);
 if(!isAdmin)return null;
 const ninja=['fruits','vegetables','harvest'].includes(topic);
 if(playing)return ninja?<NinjaScreen key={session} onBack={()=>setPlaying(false)} testSetup={{topic:(topic==='harvest'?'all':topic) as NinjaTopic,gender,sound:audio.ninja}}/>:<BotBattleScreen key={session} topic={topic} gender={gender} audio={audio} onBack={()=>setPlaying(false)}/>;
 return <div className="screen battle-screen"><BackButton onClick={onBack} label={backLabel}/><h1>🤖 Проверка игр</h1><p>Только для администратора · без статистики</p><label className="ninja-topic">Бот<select aria-label="Пол бота" value={gender} onChange={e=>setGender(e.target.value as MemberGender)}><option value="man">Мальчик</option><option value="woman">Девочка</option></select></label><div className="battle-label">Выбери тему</div><TopicWheel items={Object.entries(botVocabulary).map(([id,t])=>({id,title:t.title}))} value={topic} onChange={setTopic}/><p className="battle-rules">{ninja?'🥷 Ниндзя':'🏓 Пиклбол'} · персонаж бота выбирается по указанному полу</p><button className="big-button" onClick={()=>{audio.sound.ready();audio.court.ready();audio.ninja.ready();primeBattleSpeech();setSession(n=>n+1);setPlaying(true);}}>Начать проверку</button></div>;
}
