import { useState } from 'react';
import { BackButton } from '../components/BackButton';
import { BattleStatistics } from '../../battle/BattleStatistics';
import { DigitBattleScreen } from './DigitBattleScreen';
export function BeginnerBattleScreen({ onBack, playerName }: { onBack: () => void; playerName?: string }) {
 const [view,setView] = useState<'statistics'|'games'>('statistics');
 if (view === 'games') return <DigitBattleScreen showPicker playerName={playerName} onBack={() => setView('statistics')}/>;
 return <div className="screen beginner-battle-hub">
  <BackButton onClick={onBack} label="К играм"/>
  <h1 className="screen-title">Батл</h1>
  <BattleStatistics onPlay={() => setView('games')} startLabel="Начать"/>
 </div>;
}
