import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Autocomplete as PrimerAutocomplete} from '@primer/react';
import type {ReactElement} from 'react';
import {AutocompleteOverlayView} from './autocomplete-overlay';

afterEach(cleanup);

// Autocomplete.Overlay requires the Autocomplete context, so wrap it in a real <Autocomplete>.
function renderInContext(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerAutocomplete>{ui}</PrimerAutocomplete>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('AutocompleteOverlayView', () => {
  it('renders its children inside the floating panel', () => {
    renderInContext(
      <AutocompleteOverlayView>
        <span>menu slot</span>
      </AutocompleteOverlayView>,
    );
    expect(screen.getByText('menu slot')).toBeInTheDocument();
  });
});
