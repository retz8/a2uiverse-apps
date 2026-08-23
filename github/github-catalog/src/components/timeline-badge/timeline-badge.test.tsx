import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline} from '@primer/react';
import type {ReactElement} from 'react';
import {TimelineBadgeView} from './timeline-badge';

afterEach(cleanup);

// A Badge renders inside a Timeline.Item; wrap it so the container context is present.
function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTimeline>
          <PrimerTimeline.Item>{ui}</PrimerTimeline.Item>
        </PrimerTimeline>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TimelineBadgeView', () => {
  it('renders its icon child inside the badge', () => {
    renderInItem(
      <TimelineBadgeView>
        <span data-testid="badge-icon">icon</span>
      </TimelineBadgeView>,
    );
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('accepts a color variant and still renders its child', () => {
    renderInItem(
      <TimelineBadgeView variant="success">
        <span data-testid="badge-icon">icon</span>
      </TimelineBadgeView>,
    );
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });
});
