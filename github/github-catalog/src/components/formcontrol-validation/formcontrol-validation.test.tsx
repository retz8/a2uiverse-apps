import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {FormControlValidationView} from './formcontrol-validation';

afterEach(cleanup);

describe('FormControlValidationView', () => {
  it('renders an error validation message', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <FormControlValidationView text="That name is already taken" variant="error" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('That name is already taken')).toBeInTheDocument();
  });

  it('renders a success validation message', () => {
    render(
      <ThemeProvider>
        <BaseStyles>
          <FormControlValidationView text="Name is available" variant="success" />
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(screen.getByText('Name is available')).toBeInTheDocument();
  });
});
