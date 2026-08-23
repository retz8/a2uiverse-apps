import type {ReactNode} from 'react';
import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineAvatarApi} from './timeline-avatar.schema';

/** Resolved props: the `child` ComponentId arrives as a built node. */
type TimelineAvatarViewProps = {
  children?: ReactNode;
};

export function TimelineAvatarView({children}: TimelineAvatarViewProps) {
  return <PrimerTimeline.Avatar>{children}</PrimerTimeline.Avatar>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TimelineAvatarView.
 * - `props.child` (required ComponentId) is built via `buildChild` — the avatar beside the badge.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TimelineAvatarComponent = createComponentImplementation(
  TimelineAvatarApi,
  ({props, buildChild}) => <TimelineAvatarView>{buildChild(props.child)}</TimelineAvatarView>,
);
