import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogTitleView} from './dialog-title';

afterEach(cleanup);

describe('DialogTitleView', () => {
  it('renders the heading text', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <DialogTitleView text="Edit notification settings" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Edit notification settings')).toBeInTheDocument();
  });
});
