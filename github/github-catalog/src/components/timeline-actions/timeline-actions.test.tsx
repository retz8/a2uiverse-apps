import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline, Button} from '@primer/react';
import type {ReactElement} from 'react';
import {TimelineActionsView} from './timeline-actions';

afterEach(cleanup);

// Actions renders inside a Timeline.Item; wrap it so the container context is present.
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

describe('TimelineActionsView', () => {
  it('renders its action-control children', () => {
    renderInItem(
      <TimelineActionsView>
        <Button>Revert</Button>
      </TimelineActionsView>,
    );
    expect(screen.getByRole('button', {name: 'Revert'})).toBeInTheDocument();
  });
});
