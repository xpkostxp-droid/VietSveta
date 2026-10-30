import { botVocabulary } from './botVocabulary';
import { speakVietnamese } from '../domain/speech';
let primed=false;
export function primeBattleSpeech() {
 try {
  const synth=window.speechSynthesis;if(!synth)return;
  synth.resume();
  if(primed)return;
  const voice=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'));
  if(!voice)return;
  const warm=new SpeechSynthesisUtterance(' ');warm.voice=voice;warm.lang='vi-VN';warm.volume=0;
  synth.speak(warm);primed=true;
 } catch { /* Speech remains optional; answering never depends on it. */ }
}
export function vietnameseWord(topic:string,word:string) {
 const pair=botVocabulary[topic]?.words.find(([vi,ru])=>vi===word||ru===word);
 // Only send Vietnamese to the Vietnamese voice, including reverse-direction tasks.
 return pair?.[0]??(!/[а-яё]/i.test(word)?word:'');
}
export function speakBattleWord(topic:string,word:string) {
 const vi=vietnameseWord(topic,word);if(vi)speakVietnamese(vi);
}
