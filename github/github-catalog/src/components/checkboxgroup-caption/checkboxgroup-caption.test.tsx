import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {CheckboxGroupCaptionView} from './checkboxgroup-caption';

afterEach(cleanup);

describe('CheckboxGroupCaptionView', () => {
  it('renders the caption text', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <CheckboxGroupCaptionView text="Choose which events email you" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Choose which events email you')).toBeInTheDocument();
  });
});
