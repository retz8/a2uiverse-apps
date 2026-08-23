import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogButtonsView} from './dialog-buttons';

afterEach(cleanup);

describe('DialogButtonsView', () => {
  it('renders the footer buttons and fires their onClick', () => {
    const onSave = vi.fn();
    render(
      <ThemeProvider>
        <BaseStyles>
          <DialogButtonsView
            buttons={[
              {content: 'Save', buttonType: 'primary', onClick: onSave},
              {content: 'Cancel', buttonType: 'default', onClick: vi.fn()},
            ]}
          />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
