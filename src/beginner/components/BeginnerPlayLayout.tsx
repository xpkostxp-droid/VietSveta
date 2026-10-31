import type { CSSProperties, ReactNode } from 'react';
import './ProfessionsGameScreen.css';
import '../../components/SharedPlayLayout.css';
import './BeginnerPlayLayout.css';

export const beginnerPlayClass = 'work-blitz work-active profession-session beginner-play';

/** The work-vocabulary game is the single frame/label standard for beginner games. */
export function GamePrompt({ label, lang, visual, children, long = false }: {
  label: ReactNode; lang?: string; visual?: ReactNode; children?: ReactNode; long?: boolean;
}) {
  return <div className={'family-card work-prompt' + (!visual ? ' work-prompt-text' : '')}>
    <div className={'profession-illustration' + (!visual ? ' profession-empty' : '')}>
      {visual}
      {children}
      <h2 className={'profession-caption' + (long ? ' beginner-caption-long' : '')} lang={lang}>{label}</h2>
    </div>
  </div>;
}

export function GameChoices({ children, count = 3, columns = count > 3 ? 2 : 1, rows = Math.max(3, Math.ceil(count / columns)), className = '', label }: {
  children: ReactNode; count?: number; columns?: number; rows?: number; className?: string; label?: string;
}) {
  const style = { '--play-columns': columns, '--play-rows': rows } as CSSProperties;
  return <div className={'family-choices work-options ' + className} style={style} aria-label={label}>{children}</div>;
}

export function GameProgress({ children, progress }: { children: ReactNode; progress?: number }) {
  return <>
    <div className="work-status beginner-progress"><strong>{children}</strong><small>Без таймера</small></div>
    <div className="work-timebar" aria-hidden="true"><div style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }} /></div>
  </>;
}
