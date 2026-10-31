import {existsSync,readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {travelPhotos} from '../components/TravelPicture';
import {peoplePhotos} from '../components/PeoplePicture';
import {familyPhotos} from '../components/FamilyPicture';
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

it('packages every country, people and family game photo at its published path',()=>{
 const scenes=JSON.parse(readFileSync('scripts/beginner-card-scenes.json','utf-8')) as {file:string}[];
 expect(scenes).toHaveLength(51);
 for(const scene of scenes)expect(existsSync(scene.file),scene.file).toBe(true);
 for(const src of [...Object.values(travelPhotos),...Object.values(peoplePhotos),...Object.values(familyPhotos)]){
  const file='public/'+src.replace(/^\//,'');expect(existsSync(file),file).toBe(true);
 }
});
