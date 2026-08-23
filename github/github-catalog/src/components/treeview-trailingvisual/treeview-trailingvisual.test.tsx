import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewTrailingVisualView} from './treeview-trailingvisual';

afterEach(cleanup);

// TrailingVisual reads Primer's item context, so it is composed inside an Item.
function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTreeView aria-label="Files">
          <PrimerTreeView.Item id="item">
            file.ts
            {ui}
          </PrimerTreeView.Item>
        </PrimerTreeView>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewTrailingVisualView', () => {
  it('renders its icon child after the label', () => {
    renderInItem(
      <TreeViewTrailingVisualView label="Changed">
        <span data-testid="trailing-icon">icon</span>
      </TreeViewTrailingVisualView>,
    );
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
  });

  it('exposes the accessible label', () => {
    renderInItem(
      <TreeViewTrailingVisualView label="Changed">
        <span data-testid="trailing-icon">icon</span>
      </TreeViewTrailingVisualView>,
    );
    expect(screen.getByText('Changed')).toBeInTheDocument();
  });
});
