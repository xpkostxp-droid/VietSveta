// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { MarketGameScreen } from './MarketGameScreen';
vi.mock('./MarketBlitzScreen',()=>({MarketBlitzScreen:({category,onBack}:{category:string;onBack:()=>void})=><div>{category}<button onClick={onBack}>Назад</button></div>}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('offers three green ranked games without training',async()=>{
 const node=document.createElement('div');const root=createRoot(node);
 try{
 await act(async()=>root.render(<MarketGameScreen onBack={()=>{}}/>));
 expect(node.querySelectorAll('.big-button')).toHaveLength(3);
 expect(node.textContent).not.toContain('Обучение');
 for(const [label,category] of [['🍉 Фрукты','fruits'],['🥕 Овощи','vegetables'],['⚡ Суперблиц · фрукты и овощи','all']]){
 await act(async()=>[...node.querySelectorAll('button')].find(b=>b.textContent===label)!.click());
 expect(node.textContent).toContain(category);
 await act(async()=>node.querySelector('button')!.click());
 }
 }finally{await act(async()=>root.unmount());}
});
