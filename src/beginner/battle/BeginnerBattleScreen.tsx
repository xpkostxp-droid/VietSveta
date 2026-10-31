import { useState } from 'react';
import { BattleScreen } from '../../battle/BattleScreen';
import { DigitBattleScreen } from './DigitBattleScreen';
export function BeginnerBattleScreen({ onBack, playerName }: { onBack: () => void; playerName?: string }) {
 const [training,setTraining]=useState(false);
 if(training)return <DigitBattleScreen playerName={playerName} onBack={()=>setTraining(false)}/>;
 return <BattleScreen course="beginner" onBack={onBack} onTraining={()=>setTraining(true)}/>;
}
