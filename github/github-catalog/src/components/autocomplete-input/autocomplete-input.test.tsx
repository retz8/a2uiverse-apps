import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Autocomplete as PrimerAutocomplete} from '@primer/react';
import type {ReactElement} from 'react';
import {AutocompleteInputView} from './autocomplete-input';

afterEach(cleanup);

// Autocomplete.Input requires the Autocomplete context, so wrap it in a real <Autocomplete>.
function renderInContext(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerAutocomplete>{ui}</PrimerAutocomplete>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('AutocompleteInputView', () => {
  it('renders a literal value into the text field', () => {
    renderInContext(<AutocompleteInputView value="bug" />);
    expect(screen.getByRole('combobox')).toHaveValue('bug');
  });

  it('calls the two-way setValue on edit (write-back to the bound path)', () => {
    const setValue = vi.fn();
    renderInContext(<AutocompleteInputView value="" setValue={setValue} />);
    fireEvent.change(screen.getByRole('combobox'), {target: {value: 'feat'}});
    expect(setValue).toHaveBeenCalledWith('feat');
  });

  it('shows the placeholder while empty', () => {
    renderInContext(<AutocompleteInputView placeholder="Search labels" />);
    expect(screen.getByPlaceholderText('Search labels')).toBeInTheDocument();
  });

  it('honors the disabled flag', () => {
    renderInContext(<AutocompleteInputView value="bug" disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('drives aria-invalid from the error validationStatus', () => {
    renderInContext(<AutocompleteInputView value="bug" validationStatus="error" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards required as aria-required', () => {
    renderInContext(<AutocompleteInputView value="bug" required />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });

  it('maps accessibility.label to aria-label', () => {
    renderInContext(<AutocompleteInputView value="bug" accessibility={{label: 'Labels'}} />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Labels');
  });

  it('renders a leadingVisual slot inside the field', () => {
    const {container} = renderInContext(
      <AutocompleteInputView value="bug" leadingVisual={<svg data-testid="lv" />} />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
