import {useEffect} from 'react';
import {supabase,type Member} from './cloud';
import {startStudyCollection} from './studyTelemetry';
export function useStudyCollection(member:Member|null){
 useEffect(()=>{
  if(!member||member.is_admin)return;
  return startStudyCollection(member.user_id,async(activity,answers)=>{
   // Serial requests, at most once per 30 seconds, independent from gameplay.
   if(activity.length){const {error}=await supabase.from('study_activity').upsert(activity,{onConflict:'id'});if(error)throw error;}
   if(answers.length){const {error}=await supabase.from('study_answers').upsert(answers,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;}
  });
 },[member?.user_id,member?.is_admin]);
}
