import {useContext} from 'react';
import {Avatar as PrimerAvatar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AvatarApi} from './avatar.schema';
import {AvatarStackItemContext} from '../../shared/avatar-stack-context';

/** Resolved props: `src`/`alt` are plain strings after the binder resolves the DynamicStrings. */
type AvatarViewProps = {
  src: string;
  alt?: string;
  size?: number;
  square?: boolean;
};

export function AvatarView({src, alt, size, square}: AvatarViewProps) {
  // Inside an AvatarStack, Primer's per-item injection (the overlap `AvatarItem` class carrying the
  // `--avatar-stack-size` sizing, and the stack's `square` flag) arrives via context — the binder's
  // opaque child otherwise swallows it. The className must land on the real <img> for the
  // overlap/size/square styling to apply, and the stack's square wins over a per-avatar square.
  // Outside a stack, context is null and this is a plain pass-through.
  const stackItem = useContext(AvatarStackItemContext);
  return (
    <PrimerAvatar
      src={src}
      alt={alt}
      size={size}
      square={stackItem?.square ?? square}
      className={stackItem?.className}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders AvatarView. Avatar has
 * no ComponentId/Action row, so there is no buildChild/onClick — resolved values pass
 * straight through. Props are passed explicitly (no spread): resolved props include
 * extra binder setters that would leak as unknown props.
 */
export const AvatarComponent = createComponentImplementation(AvatarApi, ({props}) => (
  <AvatarView src={props.src} alt={props.alt} size={props.size} square={props.square} />
));
