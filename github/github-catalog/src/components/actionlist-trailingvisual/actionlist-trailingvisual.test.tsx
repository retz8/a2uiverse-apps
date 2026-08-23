import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListTrailingVisualView} from './actionlist-trailingvisual';

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

describe('ActionListTrailingVisualView', () => {
  it('renders its visual content after the label', () => {
    renderInItem(
      <ActionListTrailingVisualView>
        <span data-testid="tv">3</span>
      </ActionListTrailingVisualView>,
    );
    expect(screen.getByTestId('tv')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });
});
