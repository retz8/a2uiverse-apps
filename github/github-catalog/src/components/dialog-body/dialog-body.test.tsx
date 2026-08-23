import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogBodyView} from './dialog-body';

afterEach(cleanup);

describe('DialogBodyView', () => {
  it('renders a Dialog.Body region with its children', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <DialogBodyView>Body content</DialogBodyView>
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(container.querySelector('[data-component="Dialog.Body"]')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});
