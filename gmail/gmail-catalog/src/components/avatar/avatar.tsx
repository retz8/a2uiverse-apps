import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AvatarApi} from './avatar.schema.js';

/** The first letter or digit of the name, upper-cased; an address counts from its local part. */
export function initialOf(name: string): string {
  const match = name.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toLocaleUpperCase() : '?';
}

export function AvatarView({
  name,
  size = 'large',
}: {
  name: string;
  size?: 'small' | 'medium' | 'large';
}) {
  return (
    <span className="gm-avatar" data-size={size} role="img" aria-label={name}>
      {initialOf(name)}
    </span>
  );
}

export const Avatar = createComponentImplementation(AvatarApi, ({props}) => (
  <AvatarView name={props.name ?? ''} size={props.size} />
));
