import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {SelectView} from './select';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const options = (
  <>
    <option value="bug">Bug</option>
    <option value="feature">Feature</option>
    <option value="docs">Docs</option>
  </>
);

describe('SelectView', () => {
  it('renders the options and reflects the selected value', () => {
    renderView(<SelectView value="feature">{options}</SelectView>);
    const el = screen.getByRole('combobox') as HTMLSelectElement;
    expect(el.value).toBe('feature');
    expect(screen.getByRole('option', {name: 'Bug'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Docs'})).toBeInTheDocument();
  });

  it('calls the two-way setter on selection change', () => {
    const setValue = vi.fn();
    renderView(
      <SelectView value="feature" setValue={setValue}>
        {options}
      </SelectView>,
    );
    fireEvent.change(screen.getByRole('combobox'), {target: {value: 'docs'}});
    expect(setValue).toHaveBeenCalledWith('docs');
  });

  it('shows a placeholder leading option', () => {
    renderView(
      <SelectView value="" placeholder="Choose a label">
        {options}
      </SelectView>,
    );
    expect(screen.getByRole('option', {name: 'Choose a label'})).toBeInTheDocument();
  });

  it('disables the control', () => {
    renderView(
      <SelectView value="feature" disabled>
        {options}
      </SelectView>,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('marks the control required', () => {
    renderView(
      <SelectView value="feature" required>
        {options}
      </SelectView>,
    );
    // Primer Select forwards `required` to the native <select> attribute (not aria-required).
    expect(screen.getByRole('combobox')).toBeRequired();
  });

  it('drives aria-invalid from an error validationStatus', () => {
    renderView(
      <SelectView value="feature" validationStatus="error">
        {options}
      </SelectView>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('maps accessibility label/description onto aria-* attributes', () => {
    renderView(
      <SelectView value="feature" accessibility={{label: 'Label', description: 'Pick a label'}}>
        {options}
      </SelectView>,
    );
    const el = screen.getByRole('combobox');
    expect(el).toHaveAttribute('aria-label', 'Label');
    expect(el).toHaveAttribute('aria-description', 'Pick a label');
  });
});
