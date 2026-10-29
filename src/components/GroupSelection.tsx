import { BackButton } from './BackButton';
export type CourseSection = 'games' | 'listening' | 'theory' | 'cards';
const titles: Record<CourseSection,string> = {games:'Игры',listening:'Аудирование',theory:'Теория',cards:'Карточки'};
export function GroupSelection({section,onBack,onChoose}:{section:CourseSection;onBack:()=>void;onChoose:(group:'beginner'|'advanced')=>void}) {
 return <div className="screen"><BackButton onClick={onBack} label="На главную"/><h1 className="screen-title">{titles[section]}</h1><div className="market-options" style={{gap:18}}><button className="big-button" style={{minHeight:90,fontSize:'1.3rem',fontWeight:800}} onClick={()=>onChoose('beginner')}>Начальная группа</button><button className="big-button" style={{minHeight:90,fontSize:'1.3rem',fontWeight:800}} onClick={()=>onChoose('advanced')}>Продвинутая группа</button></div></div>;
}
