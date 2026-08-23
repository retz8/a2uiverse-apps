import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogCloseButtonView} from './dialog-closebutton';

afterEach(cleanup);

describe('DialogCloseButtonView', () => {
  it('renders a Close icon button and fires onClose when clicked', () => {
    const onClose = vi.fn();
    render(
      <ThemeProvider>
        <BaseStyles>
          <DialogCloseButtonView onClose={onClose} />
        </BaseStyles>
      </ThemeProvider>,
    );
    const close = screen.getByRole('button', {name: 'Close'});
    expect(close).toBeInTheDocument();
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
