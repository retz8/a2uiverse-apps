import {createComponentImplementation} from '@a2ui/react/v0_9';
import {Glyph} from '../../shared/glyph.js';
import {AvatarApi} from './avatar.schema.js';

/** The first letter or digit of the name, upper-cased; an address counts from its local part. */
export function initialOf(name: string): string {
  const match = name.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toLocaleUpperCase() : '?';
}

export type Response = 'accepted' | 'declined' | 'awaiting';

/**
 * A response as the Calendar API spells it (`accepted`, `declined`, `tentative`, `needsAction`) or
 * as a person reads it ("Accepted", "Yes", "No", "Maybe", "No answer yet"). Anything that is not
 * a yes or a no is still awaited.
 */
export function responseOf(status: string): Response {
  const word = status.trim().toLowerCase();
  if (word === 'accepted' || word === 'yes' || word === 'going') return 'accepted';
  if (word === 'declined' || word === 'no' || word === 'not going') return 'declined';
  return 'awaiting';
}

const BADGE = {accepted: 'check', declined: 'close', awaiting: 'help'} as const;

type AvatarViewProps = {name: string; status?: string; size?: 'small' | 'medium' | 'large'};

export function AvatarView({name, status, size = 'large'}: AvatarViewProps) {
  const response = status ? responseOf(status) : undefined;
  return (
    <span
      className="gc-avatar"
      data-size={size}
      role="img"
      aria-label={status ? `${name}, ${status}` : name}
    >
      {initialOf(name)}
      {response ? (
        <span className="gc-avatar-badge" data-response={response}>
          <Glyph name={BADGE[response]} />
        </span>
      ) : null}
    </span>
  );
}

export const Avatar = createComponentImplementation(AvatarApi, ({props}) => (
  <AvatarView name={props.name ?? ''} status={props.status} size={props.size} />
));
