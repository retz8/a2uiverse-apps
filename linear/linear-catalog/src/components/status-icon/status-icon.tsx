import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StatusIconApi} from './status-icon.schema.js';
import {FILL, toneOf, type StatusTone} from './tone.js';

// Drawn for this catalog on a 14-unit grid: a ring of radius 5.5, a centre of radius 3.
const C = 7;
const RING = 5.5;
const STROKE = 1.5;
const CORE = 3;
/** Eight dashes around a backlog ring. */
const DASH = (2 * Math.PI * RING) / 16;

/** A wedge from twelve o'clock, clockwise, covering `share` of the centre. */
export function wedge(share: number): string {
  const angle = share * 2 * Math.PI;
  const x = C + CORE * Math.sin(angle);
  const y = C - CORE * Math.cos(angle);
  const large = share > 0.5 ? 1 : 0;
  return `M${C} ${C}L${C} ${C - CORE}A${CORE} ${CORE} 0 ${large} 1 ${x.toFixed(3)} ${y.toFixed(3)}Z`;
}

const ring = (dashed = false) => (
  <circle
    cx={C}
    cy={C}
    r={RING}
    fill="none"
    stroke="currentColor"
    strokeWidth={STROKE}
    strokeDasharray={dashed ? `${DASH} ${DASH}` : undefined}
  />
);

/** A filled disc with a mark knocked out of it in the panel's colour. */
const disc = (mark: string) => (
  <>
    <circle cx={C} cy={C} r={RING + STROKE / 2} fill="currentColor" />
    <path
      d={mark}
      className="lc-knockout"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
);

function Glyph({tone}: {tone: StatusTone}) {
  switch (tone) {
    case 'backlog':
      return ring(true);
    case 'started':
    case 'review':
      return (
        <>
          {ring()}
          <path d={wedge(FILL[tone] ?? 0.5)} fill="currentColor" />
        </>
      );
    case 'completed':
      return disc('M4.5 7.25 6.25 9 9.5 5.25');
    case 'canceled':
      return disc('M5 5l4 4M9 5 5 9');
    case 'triage':
      return (
        <>
          {ring()}
          <circle cx={C} cy={C} r={1.5} fill="currentColor" />
        </>
      );
    default:
      return ring();
  }
}

export function StatusIconView({status, type}: {status: string; type: string}) {
  const tone = toneOf(type, status);
  return (
    <svg
      className="lc-status"
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

export const StatusIcon = createComponentImplementation(StatusIconApi, ({props}) => (
  <StatusIconView status={props.status ?? ''} type={props.type ?? ''} />
));
