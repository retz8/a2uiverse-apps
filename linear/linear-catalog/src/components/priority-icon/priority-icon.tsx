import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PriorityIconApi} from './priority-icon.schema.js';
import {BARS, levelOf, type PriorityLevel} from './level.js';

/**
 * Three bottom-aligned bars, measured on Linear's priority icons at 7 wide with 4 between and
 * heights 14, 20 and 27, scaled into the 16-unit box; the unfilled ones stay as a faint track.
 */
function Bars({filled}: {filled: number}) {
  const bars = [
    {x: 0.7, h: 7.4},
    {x: 6.5, h: 10.6},
    {x: 12.3, h: 14.3},
  ];
  return (
    <>
      {bars.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={15.2 - bar.h}
          width="3.7"
          height={bar.h}
          rx="1"
          fill="currentColor"
          fillOpacity={i < filled ? 1 : 0.4}
        />
      ))}
    </>
  );
}

function Glyph({level}: {level: PriorityLevel}) {
  if (level === 'urgent') {
    return (
      <>
        <rect x="1" y="1" width="14" height="14" rx="2.4" fill="currentColor" />
        <path
          d="M8 4 V9.2"
          stroke="var(--linear-icon-knockout, #ffffff)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.9" r="1.1" fill="var(--linear-icon-knockout, #ffffff)" />
      </>
    );
  }
  if (level === 'none') {
    return (
      <>
        {[1.5, 6.5, 11.5].map(x => (
          <rect
            key={x}
            x={x}
            y="7.25"
            width="3"
            height="1.5"
            rx="0.75"
            fill="currentColor"
            fillOpacity="0.9"
          />
        ))}
      </>
    );
  }
  return <Bars filled={BARS[level]} />;
}

/** Resolved props: `priority` is a plain string after the binder resolves the DynamicString. */
export function PriorityIconView({priority}: {priority: string}) {
  const level = levelOf(priority);
  return (
    <svg
      className="linear-priority"
      data-level={level}
      role="img"
      aria-label={priority || 'No priority'}
      width="14"
      height="14"
      viewBox="0 0 16 16"
    >
      <title>{priority || 'No priority'}</title>
      <Glyph level={level} />
    </svg>
  );
}

/** Catalog entry: the generic binder resolves props, then renders PriorityIconView. */
export const PriorityIcon = createComponentImplementation(PriorityIconApi, ({props}) => (
  <PriorityIconView priority={props.priority ?? ''} />
));
