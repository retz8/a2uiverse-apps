import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ConfirmationDialogView} from './confirmationdialog';

afterEach(cleanup);

// ConfirmationDialog renders through Primer's Dialog, which portals to the document body and manages
// its own backdrop/focus, so a ThemeProvider frame is enough — no host container needed.
function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('ConfirmationDialogView', () => {
  it('renders as an alertdialog with its title, body, and the two buttons', () => {
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        Your unsaved edits will be lost.
      </ConfirmationDialogView>,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    expect(screen.getByText('Your unsaved edits will be lost.')).toBeInTheDocument();
    // Default labels come from Primer when the content props are unset.
    expect(screen.getByRole('button', {name: 'OK'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument();
  });

  it('honours custom confirm/cancel button labels', () => {
    renderInTheme(
      <ConfirmationDialogView
        title="Delete branch?"
        confirmButtonContent="Delete"
        cancelButtonContent="Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      >
        Body
      </ConfirmationDialogView>,
    );
    expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Keep'})).toBeInTheDocument();
  });

  it('fires onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={onConfirm} onCancel={onCancel}>
        Body
      </ConfirmationDialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'OK'}));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('fires onCancel when the cancel button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={onConfirm} onCancel={onCancel}>
        Body
      </ConfirmationDialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('routes the header close button (X) to onCancel and dismisses the dialog', () => {
    const onCancel = vi.fn();
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={vi.fn()} onCancel={onCancel}>
        Body
      </ConfirmationDialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(onCancel).toHaveBeenCalledTimes(1);
    // The close button is a pure dismissal gesture: the leaf owns visibility, so the dialog unmounts.
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open when a footer button is clicked (cancel button leaves it mounted)', () => {
    const onCancel = vi.fn();
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={vi.fn()} onCancel={onCancel}>
        Body
      </ConfirmationDialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(onCancel).toHaveBeenCalledTimes(1);
    // Footer buttons fire their action but do not self-close — an agent writeback (loading/body
    // swap) stays observable. Only ✕ / Escape / backdrop dismiss.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('focuses the confirm button by default (non-destructive)', () => {
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        Body
      </ConfirmationDialogView>,
    );
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'OK'}));
  });

  it('focuses the cancel button for a destructive (danger) action', () => {
    renderInTheme(
      <ConfirmationDialogView
        title="Delete branch?"
        confirmButtonType="danger"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      >
        Body
      </ConfirmationDialogView>,
    );
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Cancel'}));
  });

  it('honours overrideButtonFocus onto the cancel button', () => {
    renderInTheme(
      <ConfirmationDialogView
        title="Discard changes?"
        overrideButtonFocus="cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      >
        Body
      </ConfirmationDialogView>,
    );
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Cancel'}));
  });
});
