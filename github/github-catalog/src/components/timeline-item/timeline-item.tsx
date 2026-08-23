import type {ReactNode} from 'react';
import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineItemApi} from './timeline-item.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: ChildList arrives as built `children`; `condensed` passes through. */
type TimelineItemViewProps = {
  condensed?: boolean;
  children?: ReactNode;
};

export function TimelineItemView({condensed, children}: TimelineItemViewProps) {
  return <PrimerTimeline.Item condensed={condensed}>{children}</PrimerTimeline.Item>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TimelineItemView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each badge/body/avatar/
 *   actions leaf via `buildChild`.
 * - `props.condensed` passes through unchanged.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TimelineItemComponent = createComponentImplementation(
  TimelineItemApi,
  ({props, buildChild}) => (
    <TimelineItemView condensed={props.condensed}>
      {renderChildList(props.children, buildChild)}
    </TimelineItemView>
  ),
);
