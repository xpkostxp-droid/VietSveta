import '../index.css';
import {ProfessionsGameScreen} from './ProfessionsGameScreen';
import {TravelGameScreen} from './TravelGameScreen';
import {PeopleGameScreen} from './PeopleGameScreen';
import {PhoneGameScreen} from './PhoneGameScreen';
import type {ProfileGameId} from '../../domain/profileGames';
export default function ProfileBeginnerGame({game,onBack}:{game:ProfileGameId;onBack:()=>void}){
 return <div className="beginner-area">{game==='lesson5-professions'||game==='lesson5-work'?<ProfessionsGameScreen initialGroup={game==='lesson5-professions'?'professions':'work'} onBack={onBack}/>:game==='lesson7-countries'||game==='lesson7-travel'?<TravelGameScreen initialGroup={game==='lesson7-countries'?'countries':'travel'} onBack={onBack}/>:game==='lesson8-people'?<PeopleGameScreen onBack={onBack}/>:<PhoneGameScreen onBack={onBack}/>}</div>;
}
