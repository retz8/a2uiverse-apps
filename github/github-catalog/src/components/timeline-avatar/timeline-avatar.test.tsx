import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Timeline as PrimerTimeline} from '@primer/react';
import type {ReactElement} from 'react';
import {TimelineAvatarView} from './timeline-avatar';

afterEach(cleanup);

// An Avatar renders inside a Timeline.Item; wrap it so the container context is present.
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

describe('TimelineAvatarView', () => {
  it('renders its avatar child beside the entry', () => {
    renderInItem(
      <TimelineAvatarView>
        <span data-testid="avatar-child">avatar</span>
      </TimelineAvatarView>,
    );
    expect(screen.getByTestId('avatar-child')).toBeInTheDocument();
  });
});
