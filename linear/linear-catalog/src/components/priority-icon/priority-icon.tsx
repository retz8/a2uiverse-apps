import {createComponentImplementation} from '@a2ui/react/v0_9';
import {BARS, levelOf, type PriorityLevel} from './level.js';
import {PriorityIconApi} from './priority-icon.schema.js';

// Drawn for this catalog on a 14-unit grid: three bars on one baseline, a square for urgent.
const BASE = 12;
const BAR_WIDTH = 2.5;
const BAR_X = [2, 5.75, 9.5];
const BAR_HEIGHT = [4.5, 7.5, 10.5];

function Glyph({level}: {level: PriorityLevel}) {
  if (level === 'urgent') {
    return (
      <>
        <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" className="lc-priority-urgent" />
        <path
          d="M7 4.25v3.5M7 9.9v.1"
          className="lc-knockout"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    );
  }
  if (level === 'none') {
    return (
      <path d="M2 7h2M6 7h2M10 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    );
  }
  const filled = BARS[level];
  return (
    <>
      {BAR_X.map((x, index) => (
        <rect
          key={x}
          x={x}
          y={BASE - BAR_HEIGHT[index]}
          width={BAR_WIDTH}
          height={BAR_HEIGHT[index]}
          rx="0.75"
          data-filled={index < filled ? '' : undefined}
        />
      ))}
    </>
  );
}

export function PriorityIconView({priority}: {priority: string}) {
  const level = levelOf(priority);
  const label = priority.trim() || 'No priority';
  return (
    <svg
      className="lc-priority"
      data-level={level}
      role="img"
      aria-label={label}
      width="14"
      height="14"
      viewBox="0 0 14 14"
    >
      <title>{label}</title>
      <Glyph level={level} />
    </svg>
  );
}

export const PriorityIcon = createComponentImplementation(PriorityIconApi, ({props}) => (
  <PriorityIconView priority={props.priority ?? ''} />
));
