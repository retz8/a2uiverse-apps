import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListLinkItemView} from './actionlist-linkitem';

afterEach(cleanup);

function renderInList(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>{ui}</PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListLinkItemView', () => {
  it('renders a link to href with its label', () => {
    renderInList(
      <ActionListLinkItemView href="https://github.com/octocat/repo">
        Open on GitHub
      </ActionListLinkItemView>,
    );
    const link = screen.getByRole('link', {name: 'Open on GitHub'});
    expect(link).toHaveAttribute('href', 'https://github.com/octocat/repo');
  });

  it('applies target for a new-tab link', () => {
    renderInList(
      <ActionListLinkItemView href="https://x" target="_blank">
        External
      </ActionListLinkItemView>,
    );
    expect(screen.getByRole('link', {name: 'External'})).toHaveAttribute('target', '_blank');
  });
});
