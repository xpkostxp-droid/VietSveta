export const ninjaCharacters=[
 {id:'teal-man',name:'Бирюзовый самурай',move:'Диагональный взмах'},
 {id:'red-man',name:'Алый самурай',move:'Боковой взмах'},
 {id:'teal-woman',name:'Бирюзовая воительница',move:'Диагональный взмах'},
 {id:'red-woman',name:'Алая воительница',move:'Боковой взмах'}
] as const;
export type NinjaCharacter=typeof ninjaCharacters[number]['id'];
export const ninjaAsset=(name:string)=>`${import.meta.env.BASE_URL}ninja/${name}`;
export function ninjaFrame(elapsed:number){
 if(elapsed<0||elapsed>=620)return 0;
 if(elapsed<70)return 1;if(elapsed<160)return 2;if(elapsed<220)return 3;if(elapsed<310)return 4;if(elapsed<410)return 5;if(elapsed<510)return 6;return 7;
}
