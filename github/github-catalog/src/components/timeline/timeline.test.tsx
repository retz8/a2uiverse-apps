import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline} from '@primer/react';
import type {ReactElement} from 'react';
import {TimelineView} from './timeline';

afterEach(cleanup);

function renderWithPrimer(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('TimelineView', () => {
  it('renders a timeline with its item children', () => {
    renderWithPrimer(
      <TimelineView>
        <PrimerTimeline.Item>
          <PrimerTimeline.Body>Alpha</PrimerTimeline.Body>
        </PrimerTimeline.Item>
        <PrimerTimeline.Item>
          <PrimerTimeline.Body>Beta</PrimerTimeline.Body>
        </PrimerTimeline.Item>
      </TimelineView>,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('passes clipSidebar through to the timeline', () => {
    renderWithPrimer(
      <TimelineView clipSidebar="both">
        <PrimerTimeline.Item>
          <PrimerTimeline.Body>Alpha</PrimerTimeline.Body>
        </PrimerTimeline.Item>
      </TimelineView>,
    );
    // clipSidebar is accepted (the render folds true/'both' identically) and the entry still shows.
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
