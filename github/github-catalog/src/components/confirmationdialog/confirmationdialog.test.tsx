import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ConfirmationDialogView} from './confirmationdialog.js';

afterEach(cleanup);

// ConfirmationDialog draws in place, in the fragment's flow, so a ThemeProvider frame is enough.
function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('ConfirmationDialogView', () => {
  it('renders in place as a dialog named by its title, with its body and the two buttons', () => {
    const {container} = renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        Your unsaved edits will be lost.
      </ConfirmationDialogView>,
    );
    const dialog = screen.getByRole('dialog', {name: 'Discard changes?'});
    // Inside the fragment, not portalled over the page; not modal, so the page stays reachable.
    expect(container).toContainElement(dialog);
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(dialog).toHaveAccessibleDescription('Your unsaved edits will be lost.');
    // Primer's default labels when the content props are unset.
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

  it('draws the confirm button in its emphasis: danger, primary, or the default', () => {
    renderInTheme(
      <ConfirmationDialogView
        title="Delete branch?"
        confirmButtonType="danger"
        confirmButtonContent="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', {name: 'Delete'})).toHaveAttribute('data-variant', 'danger');
    expect(screen.getByRole('button', {name: 'Cancel'})).toHaveAttribute('data-variant', 'default');
  });

  it('takes the preset width as the most it spans', () => {
    renderInTheme(
      <ConfirmationDialogView title="Which repository?" width="large" onConfirm={vi.fn()} />,
    );
    expect(screen.getByRole('dialog')).toHaveStyle({maxWidth: '480px'});
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

  it('fires onCancel when the cancel button is clicked, and stays in place', () => {
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
    // Footer buttons fire their action but do not self-close — an agent writeback (loading/body
    // swap) stays observable. Only ✕ and Escape dismiss.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('routes Escape inside the dialog to onCancel and dismisses it', () => {
    const onCancel = vi.fn();
    renderInTheme(
      <ConfirmationDialogView title="Discard changes?" onConfirm={vi.fn()} onCancel={onCancel}>
        Body
      </ConfirmationDialogView>,
    );
    fireEvent.keyDown(screen.getByRole('button', {name: 'OK'}), {key: 'Escape'});
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses the confirm button by default when nothing else holds focus', () => {
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

  it('leaves focus where it is when something else on the page holds it', () => {
    const asking = document.createElement('input');
    document.body.append(asking);
    asking.focus();
    renderInTheme(
      <ConfirmationDialogView title="Which repository?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        Body
      </ConfirmationDialogView>,
    );
    expect(document.activeElement).toBe(asking);
    asking.remove();
  });
});
