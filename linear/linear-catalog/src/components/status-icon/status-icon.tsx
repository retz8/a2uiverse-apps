import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StatusIconApi} from './status-icon.schema.js';
import {FILL, toneOf, type StatusTone} from './tone.js';

// Measured on Linear's status icons: a ring about a seventh of the diameter wide, a wedge about
// 0.55 of the outer radius, twelve dashes around a backlog ring.
const C = 7;
const R = 6;
const RING = 2;
const DASH = (2 * Math.PI * R) / 24;

/** A pie wedge from twelve o'clock, clockwise, covering `share` of the inner disc. */
function wedge(share: number): string {
  const r = 3.85;
  const angle = share * 2 * Math.PI;
  const x = C + r * Math.sin(angle);
  const y = C - r * Math.cos(angle);
  const large = share > 0.5 ? 1 : 0;
  return `M ${C} ${C} L ${C} ${C - r} A ${r} ${r} 0 ${large} 1 ${x.toFixed(3)} ${y.toFixed(3)} Z`;
}

function Glyph({tone}: {tone: StatusTone}) {
  switch (tone) {
    case 'backlog':
      return (
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING}
          strokeDasharray={`${DASH} ${DASH}`}
        />
      );
    case 'started':
    case 'review':
      return (
        <>
          <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeWidth={RING} />
          <path d={wedge(FILL[tone] ?? 0.5)} fill="currentColor" />
        </>
      );
    case 'completed':
      return (
        <>
          <circle cx={C} cy={C} r={R + RING / 2} fill="currentColor" />
          <path
            d="M4.3 7.2 L6.2 9 L9.8 5.2"
            fill="none"
            stroke="var(--linear-icon-knockout, #ffffff)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case 'canceled':
      return (
        <>
          <circle cx={C} cy={C} r={R + RING / 2} fill="currentColor" />
          <path
            d="M5 5 L9 9 M9 5 L5 9"
            fill="none"
            stroke="var(--linear-icon-knockout, #ffffff)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    default:
      return <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeWidth={RING} />;
  }
}

/** Resolved props: plain strings after the binder resolves the DynamicStrings. */
export function StatusIconView({status, type}: {status: string; type: string}) {
  const tone = toneOf(type, status);
  return (
    <svg
      className="linear-status"
      data-tone={tone}
      role="img"
      aria-label={status}
      width="14"
      height="14"
      viewBox="0 0 14 14"
    >
      <title>{status}</title>
      <Glyph tone={tone} />
    </svg>
  );
}

/** Catalog entry: the generic binder resolves props, then renders StatusIconView. */
export const StatusIcon = createComponentImplementation(StatusIconApi, ({props}) => (
  <StatusIconView status={props.status ?? ''} type={props.type ?? ''} />
));
