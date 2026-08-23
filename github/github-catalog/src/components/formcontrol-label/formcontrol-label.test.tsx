import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {FormControlLabelView} from './formcontrol-label';

afterEach(cleanup);

describe('FormControlLabelView', () => {
  it('renders the label text', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <FormControlLabelView text="Repository name" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Repository name')).toBeInTheDocument();
  });

  it('keeps the label available when visually hidden', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <FormControlLabelView text="Repository name" visuallyHidden />
        </BaseStyles>
      </ThemeProvider>,
    );
    // Visually hidden but still in the accessibility tree.
    expect(screen.getByText('Repository name')).toBeInTheDocument();
  });
});
