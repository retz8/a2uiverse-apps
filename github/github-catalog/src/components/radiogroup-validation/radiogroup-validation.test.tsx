import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {RadioGroupValidationView} from './radiogroup-validation';

afterEach(cleanup);

describe('RadioGroupValidationView', () => {
  it('renders an error validation message', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <RadioGroupValidationView text="Please select an option" variant="error" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Please select an option')).toBeInTheDocument();
  });

  it('renders a success validation message', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <RadioGroupValidationView text="Looks good" variant="success" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Looks good')).toBeInTheDocument();
  });
});
