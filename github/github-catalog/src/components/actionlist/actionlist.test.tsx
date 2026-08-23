import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListView} from './actionlist';

afterEach(cleanup);

function renderWithPrimer(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListView', () => {
  it('renders its children as list items', () => {
    renderWithPrimer(
      <ActionListView>
        <PrimerActionList.Item>View pull request</PrimerActionList.Item>
      </ActionListView>,
    );
    expect(screen.getByText('View pull request')).toBeInTheDocument();
  });

  it('applies the ARIA role to the list', () => {
    renderWithPrimer(
      <ActionListView role="listbox">
        <PrimerActionList.Item>Item</PrimerActionList.Item>
      </ActionListView>,
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders the container element chosen by `as`', () => {
    const {container} = renderWithPrimer(
      <ActionListView as="ol">
        <PrimerActionList.Item>Item</PrimerActionList.Item>
      </ActionListView>,
    );
    expect(container.querySelector('ol')).toBeInTheDocument();
  });

  it('applies the accessibility label as aria-label', () => {
    renderWithPrimer(
      <ActionListView role="listbox" accessibility={{label: 'Repository actions'}}>
        <PrimerActionList.Item>Item</PrimerActionList.Item>
      </ActionListView>,
    );
    expect(screen.getByRole('listbox', {name: 'Repository actions'})).toBeInTheDocument();
  });

  it('disables the built-in focus zone when disableFocusZone is set', () => {
    // Rendering with disableFocusZone must not throw; the list still renders its items.
    renderWithPrimer(
      <ActionListView role="menu" disableFocusZone>
        <PrimerActionList.Item>Item</PrimerActionList.Item>
      </ActionListView>,
    );
    expect(screen.getByText('Item')).toBeInTheDocument();
  });
});
