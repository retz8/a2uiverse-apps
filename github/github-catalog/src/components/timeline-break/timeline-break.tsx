import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineBreakApi} from './timeline-break.schema';

/** Propless: renders Timeline.Break with no forwarded props. */
export function TimelineBreakView() {
  return <PrimerTimeline.Break />;
}

/** Catalog entry: a propless decorative leaf — renders the separator directly. */
export const TimelineBreakComponent = createComponentImplementation(TimelineBreakApi, () => (
  <TimelineBreakView />
));
