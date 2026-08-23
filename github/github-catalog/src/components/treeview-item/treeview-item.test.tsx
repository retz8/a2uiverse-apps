import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewItemView} from './treeview-item';

afterEach(cleanup);

function renderInTree(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTreeView aria-label="Files">{ui}</PrimerTreeView>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewItemView', () => {
  it('renders its label and reflects the given id', () => {
    const {container} = renderInTree(<TreeViewItemView id="file-a">README.md</TreeViewItemView>);
    expect(screen.getByRole('treeitem', {name: /README\.md/})).toBeInTheDocument();
    expect(container.querySelector('#file-a')).not.toBeNull();
  });

  it('fires onSelect when the row is clicked', () => {
    const onSelect = vi.fn();
    renderInTree(
      <TreeViewItemView id="file-a" onSelect={onSelect}>
        README.md
      </TreeViewItemView>,
    );
    fireEvent.click(screen.getByRole('treeitem', {name: /README\.md/}));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('marks the current item via aria-current', () => {
    renderInTree(
      <TreeViewItemView id="file-a" current>
        README.md
      </TreeViewItemView>,
    );
    expect(screen.getByRole('treeitem', {name: /README\.md/})).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('renders secondaryActions as inline icon-buttons with their count', () => {
    renderInTree(
      <TreeViewItemView
        id="file-a"
        secondaryActions={[
          {
            key: 0,
            label: 'Delete',
            count: '3',
            onClick: () => {},
            icon: <span data-testid="sa-icon">x</span>,
          },
        ]}
      >
        README.md
      </TreeViewItemView>,
    );
    expect(screen.getByTestId('sa-icon')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
