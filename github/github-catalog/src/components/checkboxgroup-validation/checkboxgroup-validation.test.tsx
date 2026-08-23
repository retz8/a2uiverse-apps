import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {CheckboxGroupValidationView} from './checkboxgroup-validation';

afterEach(cleanup);

describe('CheckboxGroupValidationView', () => {
  it('renders an error validation message', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <CheckboxGroupValidationView text="Select at least one option" variant="error" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Select at least one option')).toBeInTheDocument();
  });

  it('renders a success validation message', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <CheckboxGroupValidationView text="Preferences saved" variant="success" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Preferences saved')).toBeInTheDocument();
  });
});
