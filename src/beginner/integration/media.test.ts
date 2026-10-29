import {existsSync} from 'node:fs';
import {expect,it} from 'vitest';
import {flashCards} from '../content/cards';
import {listeningLessons} from '../content/listening/lessons';
import {phrasebook2Lessons} from '../content/listening/phrasebook2';
import {courseListeningLessons} from '../content/listening/course';
import {phrasebook2PublishedLessons} from '../content/listening/release';
it('packages all published beginner listening recordings and card pictures on the same site',()=>{
 for(const lesson of [...listeningLessons,...phrasebook2Lessons.slice(0,phrasebook2PublishedLessons),...courseListeningLessons])expect(existsSync(`public/beginner/${lesson.audio}`),lesson.audio).toBe(true);
 for(const card of flashCards)if(card.imageUrl){const path=card.imageUrl.replace(/^\.\//,'/').replace(/^\//,'');expect(existsSync(`public/${path}`),path).toBe(true);}
 expect(existsSync('public/beginner/audio/songs/ca-nha-thuong-nhau.mp3')).toBe(true);
});
