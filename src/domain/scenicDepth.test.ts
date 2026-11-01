import {afterEach,expect,it,vi} from 'vitest';
import {appScenicDepth,beginnerScenicDepth,registerScenicDepth} from './scenicDepth';
let stops:(()=>void)[]=[];afterEach(()=>{stops.forEach(stop=>stop());stops=[];});
it('follows the agreed hierarchy in both groups and keeps home unchanged',()=>{
 expect(appScenicDepth('home')).toBe(0);expect(appScenicDepth('group-selection')).toBe(1);
 for(const name of ['games-menu','theory-list','cards-lesson-list','listening'])expect(appScenicDepth(name)).toBe(2);
 for(const name of ['verbs','produce','cards-setup','questions-menu','battle'])expect(appScenicDepth(name)).toBe(3);
 for(const name of ['training','theory-lesson','listening-lesson'])expect(appScenicDepth(name)).toBe(4);
 expect(beginnerScenicDepth('games-list')).toBe(2);expect(beginnerScenicDepth('numbers-games-list')).toBe(3);expect(beginnerScenicDepth('family-game')).toBe(3);expect(beginnerScenicDepth('numbers-game')).toBe(4);expect(beginnerScenicDepth('training')).toBe(4);
});
it('keeps the deepest child active regardless of effect order and restores the parent on back',()=>{
 const game=registerScenicDepth(4);stops.push(game);const section=registerScenicDepth(2);stops.push(section);
 expect(document.body.dataset.scenicDepth).toBe('4');expect(document.body.style.getPropertyValue('--scenic-wallpaper')).toContain('depth-4-terraces.webp');
 game();expect(document.body.dataset.scenicDepth).toBe('2');expect(document.body.style.getPropertyValue('--scenic-wallpaper')).toContain('depth-2-hoian.webp');section();expect(document.body.hasAttribute('data-scenic-depth')).toBe(false);expect(document.body.style.getPropertyValue('--scenic-wallpaper')).toBe('');
});
it('does not load a scenic asset on home and tolerates repeated cleanup',()=>{
 const stop=registerScenicDepth(0);stops.push(stop);expect(document.body.hasAttribute('data-scenic-depth')).toBe(false);
 const menu=registerScenicDepth(1);menu();menu();expect(document.body.hasAttribute('data-scenic-depth')).toBe(false);
});
it('resolves wallpaper against the app directory even when CSS lives in assets',()=>{
 vi.stubEnv('BASE_URL','./');
 const base=document.createElement('base');base.href='https://example.test/VietSveta/';document.head.append(base);
 try{
  const stop=registerScenicDepth(1);stops.push(stop);
  const value=document.body.style.getPropertyValue('--scenic-wallpaper');
  const url=value.match(/url\("([^"]+)"\)/)?.[1];
  expect(url).toBe('https://example.test/VietSveta/backgrounds/depth-1-lake.webp');
  expect(new URL(url!, 'https://example.test/VietSveta/assets/index.css').pathname).toBe('/VietSveta/backgrounds/depth-1-lake.webp');
 }finally{base.remove();vi.unstubAllEnvs();}
});
