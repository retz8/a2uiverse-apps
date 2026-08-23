import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline} from '@primer/react';
import type {ReactElement} from 'react';
import {TimelineItemView} from './timeline-item';

afterEach(cleanup);

// An Item renders inside a Timeline; wrap it so the container context is present.
function renderInTimeline(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTimeline>{ui}</PrimerTimeline>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TimelineItemView', () => {
  it('renders its badge and body children', () => {
    renderInTimeline(
      <TimelineItemView>
        <PrimerTimeline.Body>A message</PrimerTimeline.Body>
      </TimelineItemView>,
    );
    expect(screen.getByText('A message')).toBeInTheDocument();
  });

  it('accepts the condensed prop and still renders its content', () => {
    renderInTimeline(
      <TimelineItemView condensed>
        <PrimerTimeline.Body>Condensed message</PrimerTimeline.Body>
      </TimelineItemView>,
    );
    expect(screen.getByText('Condensed message')).toBeInTheDocument();
  });
});
