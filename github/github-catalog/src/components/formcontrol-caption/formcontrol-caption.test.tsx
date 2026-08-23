import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {FormControlCaptionView} from './formcontrol-caption';

afterEach(cleanup);

describe('FormControlCaptionView', () => {
  it('renders the caption text', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <FormControlCaptionView text="Choose a unique repository name" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Choose a unique repository name')).toBeInTheDocument();
  });
});
