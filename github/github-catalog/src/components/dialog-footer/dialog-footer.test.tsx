import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogFooterView} from './dialog-footer';

afterEach(cleanup);

describe('DialogFooterView', () => {
  it('renders a Dialog.Footer region with its children', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <DialogFooterView>Footer content</DialogFooterView>
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(container.querySelector('[data-component="Dialog.Footer"]')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
