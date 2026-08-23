import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewView} from './treeview';

afterEach(cleanup);

function renderWithPrimer(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewView', () => {
  it('renders a tree with its item children', () => {
    renderWithPrimer(
      <TreeViewView>
        <PrimerTreeView.Item id="a">Alpha</PrimerTreeView.Item>
        <PrimerTreeView.Item id="b">Beta</PrimerTreeView.Item>
      </TreeViewView>,
    );
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('applies the accessible label to the tree', () => {
    renderWithPrimer(
      <TreeViewView accessibility={{label: 'Files'}}>
        <PrimerTreeView.Item id="a">Alpha</PrimerTreeView.Item>
      </TreeViewView>,
    );
    expect(screen.getByRole('tree')).toHaveAttribute('aria-label', 'Files');
  });
});
