import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewErrorDialogView} from './treeview-errordialog';

afterEach(cleanup);

// ErrorDialog reads Primer's item context (itemId, setIsExpanded), so it is composed inside an Item.
function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTreeView aria-label="Files">
          <PrimerTreeView.Item id="dir" defaultExpanded>
            src
            {ui}
          </PrimerTreeView.Item>
        </PrimerTreeView>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewErrorDialogView', () => {
  it('renders the dialog with its title and body content', () => {
    renderInItem(
      <TreeViewErrorDialogView title="Failed to load">
        Could not load the folder
      </TreeViewErrorDialogView>,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByText('Could not load the folder')).toBeInTheDocument();
  });

  it('fires onRetry when the Retry button is clicked', () => {
    const onRetry = vi.fn();
    renderInItem(
      <TreeViewErrorDialogView title="Failed to load" onRetry={onRetry}>
        Could not load the folder
      </TreeViewErrorDialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('fires onDismiss when the Dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    renderInItem(
      <TreeViewErrorDialogView title="Failed to load" onDismiss={onDismiss}>
        Could not load the folder
      </TreeViewErrorDialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Dismiss'}));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
