import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListLeadingVisualView} from './actionlist-leadingvisual';

afterEach(cleanup);

function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>
          <PrimerActionList.Item>
            {ui}
            Label
          </PrimerActionList.Item>
        </PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListLeadingVisualView', () => {
  it('renders its visual content before the label', () => {
    renderInItem(
      <ActionListLeadingVisualView>
        <span data-testid="lv">icon</span>
      </ActionListLeadingVisualView>,
    );
    expect(screen.getByTestId('lv')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });
});
