import { expect,it,vi } from 'vitest';
vi.mock('../domain/speech',()=>({speakVietnamese:vi.fn()}));
import { speakVietnamese } from '../domain/speech';
import { vietnameseWord,speakBattleWord } from './battleSpeech';
it('pronounces Vietnamese in either direction and never sends Cyrillic to a Vietnamese voice',()=>{
 expect(vietnameseWord('fruits','яблоко')).toBe('táo');
 expect(vietnameseWord('fruits','táo')).toBe('táo');
 expect(vietnameseWord('unknown','неизвестно')).toBe('');
 speakBattleWord('fruits','манго');expect(speakVietnamese).toHaveBeenCalledWith('xoài');
});
