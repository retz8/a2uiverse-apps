import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StatusIconApi} from './status-icon.schema.js';
import {StatusGlyph, toneOf} from '../../shared/status.js';

/** The round status glyph; the word is its accessible name. */
export function StatusIconView({status, size}: {status: string; size?: 'small' | 'medium'}) {
  const tone = toneOf(status);
  return (
    <span
      className="circleci-status-icon"
      role="img"
      aria-label={status}
      title={status}
      data-tone={tone}
      data-size={size ?? 'medium'}
    >
      <StatusGlyph tone={tone} />
    </span>
  );
}

export const StatusIcon = createComponentImplementation(StatusIconApi, ({props}) => (
  <StatusIconView status={props.status ?? ''} size={props.size} />
));
