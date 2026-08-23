import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {RadioGroupCaptionView} from './radiogroup-caption';

afterEach(cleanup);

describe('RadioGroupCaptionView', () => {
  it('renders the caption text', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <RadioGroupCaptionView text="Select one option" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Select one option')).toBeInTheDocument();
  });
});
