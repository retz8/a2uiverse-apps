import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListHeadingView} from './actionlist-heading';

afterEach(cleanup);

function renderInList(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>
          {ui}
          <PrimerActionList.Item>Item</PrimerActionList.Item>
        </PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListHeadingView', () => {
  it('renders its heading text', () => {
    renderInList(<ActionListHeadingView text="Repository actions" />);
    expect(screen.getByText('Repository actions')).toBeInTheDocument();
  });

  it('renders at the requested heading level', () => {
    const {container} = renderInList(<ActionListHeadingView text="Repository actions" as="h2" />);
    const h2 = container.querySelector('h2');
    expect(h2).toHaveTextContent('Repository actions');
  });
});
