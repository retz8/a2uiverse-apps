import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {DialogView} from './dialog';

afterEach(cleanup);

// Dialog portals to the document body and manages its own backdrop/focus, so a ThemeProvider frame
// is enough — no host container needed.
function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('DialogView', () => {
  it('renders the dialog with its title, subtitle, and body content', () => {
    renderInTheme(
      <DialogView
        title="Delete this file?"
        subtitle="This action cannot be undone"
        onClose={vi.fn()}
      >
        The file README.md will be permanently removed.
      </DialogView>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete this file?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    expect(screen.getByText('The file README.md will be permanently removed.')).toBeInTheDocument();
  });

  it('honours the alertdialog role', () => {
    renderInTheme(
      <DialogView title="Notice" role="alertdialog" onClose={vi.fn()}>
        Body
      </DialogView>,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('fires onClose when the close (X) button is clicked', () => {
    const onClose = vi.fn();
    renderInTheme(
      <DialogView title="Delete this file?" onClose={onClose}>
        Body
      </DialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes (unmounts) when the X is clicked', () => {
    renderInTheme(<DialogView title="Notice">Body</DialogView>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing when open is false', () => {
    renderInTheme(
      <DialogView title="Notice" open={false}>
        Body
      </DialogView>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('writes back false through setOpen on close', () => {
    const setOpen = vi.fn();
    renderInTheme(
      <DialogView title="Notice" setOpen={setOpen}>
        Body
      </DialogView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it('is controlled by open — reopens when open returns to true', () => {
    const frame = (open: boolean) => (
      <ThemeProvider>
        <BaseStyles>
          <DialogView title="Notice" open={open}>
            Body
          </DialogView>
        </BaseStyles>
      </ThemeProvider>
    );
    const {rerender} = render(frame(true));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(frame(false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(frame(true));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders footer buttons and fires their onClick', () => {
    const onSave = vi.fn();
    renderInTheme(
      <DialogView
        title="Delete this file?"
        onClose={vi.fn()}
        footerButtons={[
          {content: 'Later', buttonType: 'default', onClick: vi.fn()},
          {content: 'Save', buttonType: 'primary', autoFocus: true, onClick: onSave},
        ]}
      >
        Body
      </DialogView>,
    );
    const save = screen.getByRole('button', {name: 'Save'});
    expect(save).toBeInTheDocument();
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
