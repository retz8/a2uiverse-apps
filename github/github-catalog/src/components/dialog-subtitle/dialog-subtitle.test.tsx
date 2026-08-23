import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {DialogSubtitleView} from './dialog-subtitle';

afterEach(cleanup);

describe('DialogSubtitleView', () => {
  it('renders the subtitle text', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <DialogSubtitleView text="Changes apply to all devices" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Changes apply to all devices')).toBeInTheDocument();
  });
});
