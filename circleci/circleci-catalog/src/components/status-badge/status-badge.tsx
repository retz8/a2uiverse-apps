import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StatusBadgeApi} from './status-badge.schema.js';
import {StatusGlyph, toneOf} from '../../shared/status.js';

/** The status pill: the tone's glyph, then the word. */
export function StatusBadgeView({status}: {status: string}) {
  const tone = toneOf(status);
  return (
    <span className="circleci-status-badge" data-tone={tone}>
      <StatusGlyph tone={tone} />
      {status}
    </span>
  );
}

export const StatusBadge = createComponentImplementation(StatusBadgeApi, ({props}) => (
  <StatusBadgeView status={props.status ?? ''} />
));
