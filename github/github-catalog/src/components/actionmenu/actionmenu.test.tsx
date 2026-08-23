import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionMenu as PrimerActionMenu, ActionList} from '@primer/react';
import type {ReactElement, ReactNode} from 'react';
import {ActionMenuView} from './actionmenu';

afterEach(cleanup);

// ActionMenu portals its overlay to the document body and manages its own focus trap, so a
// ThemeProvider frame is enough — no host container needed.
function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

/** A realistic trigger + overlay, the real Primer subcomponents ActionMenuView slots at runtime. */
function menuChildren(): ReactNode {
  return [
    <PrimerActionMenu.Button key="trigger">Actions</PrimerActionMenu.Button>,
    <PrimerActionMenu.Overlay key="overlay">
      <ActionList>
        <ActionList.Item>View pull request</ActionList.Item>
      </ActionList>
    </PrimerActionMenu.Overlay>,
  ];
}

describe('ActionMenuView', () => {
  it('renders the trigger and, when open, the menu content', () => {
    renderInTheme(<ActionMenuView open>{menuChildren()}</ActionMenuView>);
    expect(screen.getByRole('button', {name: /Actions/})).toBeInTheDocument();
    expect(screen.getByText('View pull request')).toBeInTheDocument();
  });

  it('renders only the trigger when open is false — the menu is absent from the DOM', () => {
    renderInTheme(<ActionMenuView open={false}>{menuChildren()}</ActionMenuView>);
    expect(screen.getByRole('button', {name: /Actions/})).toBeInTheDocument();
    expect(screen.queryByText('View pull request')).not.toBeInTheDocument();
  });

  it('open gesture: clicking the trigger writes back setOpen(true)', () => {
    const setOpen = vi.fn();
    renderInTheme(
      <ActionMenuView open={false} setOpen={setOpen}>
        {menuChildren()}
      </ActionMenuView>,
    );
    fireEvent.click(screen.getByRole('button', {name: /Actions/}));
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it('close gesture: pressing Escape while open writes back setOpen(false)', () => {
    const setOpen = vi.fn();
    renderInTheme(
      <ActionMenuView open setOpen={setOpen}>
        {menuChildren()}
      </ActionMenuView>,
    );
    expect(screen.getByText('View pull request')).toBeInTheDocument();
    fireEvent.keyDown(document.body, {key: 'Escape', code: 'Escape'});
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it('runs uncontrolled when open is omitted — the menu starts closed', () => {
    renderInTheme(<ActionMenuView>{menuChildren()}</ActionMenuView>);
    expect(screen.getByRole('button', {name: /Actions/})).toBeInTheDocument();
    expect(screen.queryByText('View pull request')).not.toBeInTheDocument();
  });
});
