import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StatusBadgeApi} from './status-badge.schema.js';
import {GLYPHS, toneOf} from './tone.js';

/** Resolved props: `status` is a plain string after the binder resolves the DynamicString. */
export function StatusBadgeView({status}: {status: string}) {
  const tone = toneOf(status);
  const glyph = GLYPHS[tone];
  return (
    <span className="circleci-status" data-tone={tone}>
      {glyph ? <span aria-hidden="true">{glyph}</span> : null}
      {status}
    </span>
  );
}

/** Catalog entry: the generic binder resolves props, then renders StatusBadgeView. */
export const StatusBadge = createComponentImplementation(StatusBadgeApi, ({props}) => (
  <StatusBadgeView status={props.status ?? ''} />
));
