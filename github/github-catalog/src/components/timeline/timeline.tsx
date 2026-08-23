import type {ReactNode} from 'react';
import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineApi} from './timeline.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: ChildList arrives as built `children`; `clipSidebar` passes through. */
type TimelineViewProps = {
  clipSidebar?: boolean | 'start' | 'end' | 'both';
  children?: ReactNode;
};

export function TimelineView({clipSidebar, children}: TimelineViewProps) {
  return <PrimerTimeline clipSidebar={clipSidebar}>{children}</PrimerTimeline>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TimelineView.
 * - `props.children` is a resolved `ChildList` (static ids or a `{id, basePath}` template);
 *   `renderChildList` builds each `TimelineItem`/`TimelineBreak` via `buildChild`.
 * - `props.clipSidebar` passes through unchanged.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TimelineComponent = createComponentImplementation(
  TimelineApi,
  ({props, buildChild}) => (
    <TimelineView clipSidebar={props.clipSidebar}>
      {renderChildList(props.children, buildChild)}
    </TimelineView>
  ),
);
