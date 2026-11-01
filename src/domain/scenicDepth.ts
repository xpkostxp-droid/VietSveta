export type ScenicDepth=0|1|2|3|4;
export const scenicFiles={1:'depth-1-lake.webp',2:'depth-2-hoian.webp',3:'depth-3-garden.webp',4:'depth-4-terraces.webp'} as const;
export function appScenicDepth(name:string):ScenicDepth{
 if(name==='home')return 0;
 if(name==='group-selection')return 1;
 if(['beginner','games-menu','theory-list','cards-lesson-list','listening','pronunciation','phonetics-test-list','admin-statistics'].includes(name))return 2;
 if(['theory-lesson','training','listening-lesson','phonetics-test'].includes(name))return 4;
 return 3;
}
export function beginnerScenicDepth(name:string):ScenicDepth{
 if(name==='home')return 0;
 if(['games-list','theory-list','cards-lesson-list','listening','pronunciation','phonetics-test-list'].includes(name))return 2;
 if(['theory-lesson','training','phonetics-test','numbers-game','big-numbers-game','dialogue-game','taxi-demo','question-tower','restaurant-game'].includes(name))return 4;
 return 3;
}
const entries=new Map<symbol,ScenicDepth>();
function apply(){
 const depth=Math.max(0,...entries.values()) as ScenicDepth;
 if(depth===0){delete document.body.dataset.scenicDepth;document.body.style.removeProperty('--scenic-wallpaper');return;}
 document.body.dataset.scenicDepth=String(depth);
 document.body.style.setProperty('--scenic-wallpaper',`url("${import.meta.env.BASE_URL}backgrounds/${scenicFiles[depth as 1|2|3|4]}")`);
}
export function registerScenicDepth(depth:ScenicDepth){
 if(!depth)return()=>{};
 const token=Symbol();entries.set(token,depth);apply();
 return()=>{entries.delete(token);apply();};
}
