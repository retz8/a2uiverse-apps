import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListDescriptionView} from './actionlist-description';

afterEach(cleanup);

function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>
          <PrimerActionList.Item>
            Label
            {ui}
          </PrimerActionList.Item>
        </PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListDescriptionView', () => {
  it('renders its secondary text', () => {
    renderInItem(<ActionListDescriptionView text="opened 2 days ago" />);
    expect(screen.getByText('opened 2 days ago')).toBeInTheDocument();
  });

  it('renders a block-variant description', () => {
    renderInItem(<ActionListDescriptionView text="below the label" variant="block" />);
    expect(screen.getByText('below the label')).toBeInTheDocument();
  });
});
