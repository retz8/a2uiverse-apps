import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewSubTreeView} from './treeview-subtree';

afterEach(cleanup);

// SubTree reads Primer's item context and only reveals its contents when the parent item is
// expanded, so every case is composed inside an expanded Item.
function renderInExpandedItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTreeView aria-label="Files">
          <PrimerTreeView.Item id="parent" defaultExpanded>
            parent
            {ui}
          </PrimerTreeView.Item>
        </PrimerTreeView>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewSubTreeView', () => {
  it('renders its nested items in the done state', () => {
    renderInExpandedItem(
      <TreeViewSubTreeView state="done">
        <PrimerTreeView.Item id="child">child.ts</PrimerTreeView.Item>
      </TreeViewSubTreeView>,
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getByText('child.ts')).toBeInTheDocument();
  });

  it('shows the loading skeleton instead of children while loading', () => {
    renderInExpandedItem(
      <TreeViewSubTreeView state="loading" count={3}>
        <PrimerTreeView.Item id="child">child.ts</PrimerTreeView.Item>
      </TreeViewSubTreeView>,
    );
    // In the loading state Primer swaps the children for skeleton placeholder rows.
    expect(screen.queryByText('child.ts')).not.toBeInTheDocument();
  });
});
