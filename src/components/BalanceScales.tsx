import { balanceStacks, type ScaleBlock } from '../domain/balanceStacks';
import { useId } from 'react';

export function BalanceScales({ heavy, outcome, labels }: { heavy: 'left' | 'right'; outcome: 'question' | 'success' | 'failed'; labels: string[] }) {
  const id = useId().replace(/:/g, '');
  const stacks = balanceStacks(labels);
  const sign = heavy === 'right' ? 1 : -1;
  const angle = outcome === 'failed' ? sign * 32 : stacks.left.length === stacks.right.length ? 0 : 8;
  const left = stacks.left;
  const right = stacks.right;
  if (outcome === 'failed') stacks[heavy].push({ id: 'failed-block', label: '' });
  const pan = (side: 'left' | 'right', x: number, blocks: ScaleBlock[]) => {
    return <g className="scale-pan" style={{ transform: `rotate(${-angle}deg)`, transformOrigin: `${x}px 75px` }}>
      <path d={`M${x} 75 L${x - 34} 153 M${x} 75 L${x + 34} 153`} fill="none" stroke="#9b855a" strokeWidth="2.5" />
      <path d={`M${x - 43} 153 Q${x} 190 ${x + 43} 153 Z`} fill={`url(#${id}-pan)`} stroke="#8c6a39" strokeWidth="2" />
      <g className={outcome === 'failed' ? `scale-spill scale-spill-${side}` : ''}>
        {blocks.map((block, i) => {
          const words = block.label.split(' ');
          const middle = Math.ceil(words.length / 2);
          const lines = block.label.length <= 9 ? [block.label] : [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
          const incoming = outcome === 'success' && block.id === `answer-${labels.length - 1}` || block.id === 'failed-block';
          const top = 151 - (i + 1) * 28;
          return <g key={block.id} className={incoming ? 'scale-incoming' : ''}>
            <rect x={x - (block.label ? 44 : 17)} y={top} width={block.label ? 88 : 34} height="27" rx="5" fill={side === 'left' ? '#62b8a4' : '#e6ad58'} stroke={side === 'left' ? '#287b69' : '#ad7834'} strokeWidth="1.5" />
            {block.label ? <text className="scale-answer-label" x={x} y={top + (lines.length === 1 ? 18 : 11)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#173c32">{lines.map((line, n) => <tspan key={n} x={x} dy={n === 0 ? 0 : 12}>{line}</tspan>)}</text> : <path d={`M${x - 12} ${top + 5}h23`} stroke="#ffffff80" strokeWidth="3" strokeLinecap="round" />}
          </g>;
        })}
      </g>
    </g>;
  };
  return <svg className={'balance-scales scale-' + outcome} viewBox="0 0 340 255" role="img" aria-label={outcome === 'success' ? 'Весы уравновешены' : outcome === 'failed' ? 'Перевес: кубики падают' : 'Весы с сохранёнными словами'}>
    <defs><linearGradient id={`${id}-stand`}><stop stopColor="#bd8c44"/><stop offset=".5" stopColor="#f2d695"/><stop offset="1" stopColor="#a67531"/></linearGradient><linearGradient id={`${id}-pan`} x2="0" y2="1"><stop stopColor="#f3db9e"/><stop offset="1" stopColor="#bf8b45"/></linearGradient></defs>
    <ellipse cx="170" cy="236" rx="112" ry="9" fill="#143b3510" />
    <path d="M160 75h20l5 143h-30Z" fill={`url(#${id}-stand)`} stroke="#a87b37" strokeWidth="2"/>
    <path d="M113 230q0-19 25-19h64q25 0 25 19Z" fill={`url(#${id}-stand)`} stroke="#a87b37" strokeWidth="2"/>
    <g className="scale-beam" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '170px 75px' }}>
      <path d="M65 75Q170 54 275 75" fill="none" stroke="#ad7c36" strokeWidth="9" strokeLinecap="round"/>
      <path d="M67 72Q170 52 273 72" fill="none" stroke="#f5dca0" strokeWidth="3" strokeLinecap="round"/>
      {pan('left', 75, left)}{pan('right', 265, right)}
    </g>
    <circle cx="170" cy="75" r="12" fill="#f7e1a8" stroke="#9f7335" strokeWidth="3"/>
    <circle cx="170" cy="75" r="4" fill="#805b28"/>
  </svg>;
}
