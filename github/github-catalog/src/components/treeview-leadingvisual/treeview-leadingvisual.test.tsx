import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewLeadingVisualView} from './treeview-leadingvisual';

afterEach(cleanup);

// LeadingVisual reads Primer's item context, so it is composed inside an Item.
function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTreeView aria-label="Files">
          <PrimerTreeView.Item id="item">
            {ui}
            file.ts
          </PrimerTreeView.Item>
        </PrimerTreeView>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewLeadingVisualView', () => {
  it('renders its icon child before the label', () => {
    renderInItem(
      <TreeViewLeadingVisualView label="File">
        <span data-testid="leading-icon">icon</span>
      </TreeViewLeadingVisualView>,
    );
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
  });

  it('exposes the accessible label', () => {
    renderInItem(
      <TreeViewLeadingVisualView label="File">
        <span data-testid="leading-icon">icon</span>
      </TreeViewLeadingVisualView>,
    );
    expect(screen.getByText('File')).toBeInTheDocument();
  });
});
