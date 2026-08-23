import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionBarMenuView} from './actionbar-menu';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const icon = <span data-testid="menu-glyph">M</span>;

describe('ActionBarMenuView', () => {
  it('renders a labeled menu button with its icon (closed state)', () => {
    renderView(<ActionBarMenuView icon={icon} label="Actions" items={[]} />);
    expect(screen.getByRole('button', {name: 'Actions'})).toBeInTheDocument();
    expect(screen.getByTestId('menu-glyph')).toBeInTheDocument();
  });

  it('opens the menu and dispatches an item action on select', () => {
    const onCut = vi.fn();
    renderView(
      <ActionBarMenuView
        icon={icon}
        label="Actions"
        items={[
          {type: 'action', label: 'Cut', onClick: onCut},
          {type: 'divider'},
          {type: 'action', label: 'Delete', variant: 'danger'},
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Actions'}));
    const cut = screen.getByRole('menuitem', {name: 'Cut'});
    expect(cut).toBeInTheDocument();
    expect(screen.getByRole('menuitem', {name: 'Delete'})).toBeInTheDocument();
    fireEvent.click(cut);
    expect(onCut).toHaveBeenCalledTimes(1);
  });
});
