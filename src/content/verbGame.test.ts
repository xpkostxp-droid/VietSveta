// @vitest-environment node
import {readFileSync,statSync} from 'node:fs';
import {expect,it} from 'vitest';
import {verbGameWords} from './verbGame';
it('packages a matching nonempty MP3 for every selected Vietnamese verb',()=>{
 const base=new URL('../../public/dragon-media/voice/',import.meta.url);
 const texts=JSON.parse(readFileSync(new URL('words.json',base),'utf8'));
 expect(texts).toEqual(verbGameWords.map(w=>w[0]));
 for(let i=0;i<texts.length;i++)expect(statSync(new URL(i+'.mp3',base)).size).toBeGreaterThan(500);
});
