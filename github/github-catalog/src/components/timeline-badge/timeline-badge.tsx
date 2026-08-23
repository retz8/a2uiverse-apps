import type {ReactNode} from 'react';
import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineBadgeApi} from './timeline-badge.schema';

/** Resolved props: the `child` ComponentId arrives as a built node; `variant` passes through. */
type TimelineBadgeViewProps = {
  variant?:
    | 'accent'
    | 'success'
    | 'attention'
    | 'severe'
    | 'danger'
    | 'done'
    | 'open'
    | 'closed'
    | 'sponsors';
  children?: ReactNode;
};

export function TimelineBadgeView({variant, children}: TimelineBadgeViewProps) {
  return <PrimerTimeline.Badge variant={variant}>{children}</PrimerTimeline.Badge>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TimelineBadgeView.
 * - `props.child` (required ComponentId) is built via `buildChild` — the icon inside the circle.
 * - `props.variant` passes through as the badge's color variant.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TimelineBadgeComponent = createComponentImplementation(
  TimelineBadgeApi,
  ({props, buildChild}) => (
    <TimelineBadgeView variant={props.variant}>{buildChild(props.child)}</TimelineBadgeView>
  ),
);
