import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline} from '@primer/react';
import {TimelineBreakView} from './timeline-break';

afterEach(cleanup);

// Break renders inside a Timeline; wrap it so the container context is present.
describe('TimelineBreakView', () => {
  it('renders a decorative presentation separator', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <PrimerTimeline>
            <PrimerTimeline.Item>
              <PrimerTimeline.Body>A</PrimerTimeline.Body>
            </PrimerTimeline.Item>
            <TimelineBreakView />
          </PrimerTimeline>
        </BaseStyles>
      </ThemeProvider>,
    );
    // Primer renders the break as its own decorative separator element inside the timeline.
    expect(container.querySelector('[class*="TimelineBreak"]')).toBeInTheDocument();
  });
});
