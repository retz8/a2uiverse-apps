import type {CSSProperties} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {avatarColor} from '../../palette.js';
import {AvatarApi} from './avatar.schema.js';

/** The first letters of the first and last words; one word gives one letter. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = [...words[0]][0];
  const last = words.length > 1 ? [...words[words.length - 1]][0] : '';
  return (first + last).toUpperCase();
}

export function AvatarView({name, size}: {name: string; size?: 'small' | 'medium'}) {
  return (
    <span
      className="lc-avatar"
      data-size={size ?? 'small'}
      role="img"
      aria-label={name}
      title={name}
      style={{background: avatarColor(name)} as CSSProperties}
    >
      {initialsOf(name)}
    </span>
  );
}

export const Avatar = createComponentImplementation(AvatarApi, ({props}) => (
  <AvatarView name={props.name ?? ''} size={props.size} />
));
