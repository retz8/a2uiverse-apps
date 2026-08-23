import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogHeaderView} from './dialog-header';

afterEach(cleanup);

describe('DialogHeaderView', () => {
  it('renders a Dialog.Header region with its children', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <DialogHeaderView>Header content</DialogHeaderView>
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(container.querySelector('[data-component="Dialog.Header"]')).toBeInTheDocument();
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});
