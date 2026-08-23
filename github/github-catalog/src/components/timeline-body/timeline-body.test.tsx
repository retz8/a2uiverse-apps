import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline} from '@primer/react';
import type {ReactElement} from 'react';
import {TimelineBodyView} from './timeline-body';

afterEach(cleanup);

// A Body renders inside a Timeline.Item; wrap it so the container context is present.
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

describe('TimelineBodyView', () => {
  it('renders its message content', () => {
    renderInItem(<TimelineBodyView>This is a message</TimelineBodyView>);
    expect(screen.getByText('This is a message')).toBeInTheDocument();
  });
});
