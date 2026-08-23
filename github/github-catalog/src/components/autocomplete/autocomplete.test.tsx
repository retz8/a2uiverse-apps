import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {AutocompleteView} from './autocomplete';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('AutocompleteView', () => {
  it('renders its children inside the Autocomplete context wrapper', () => {
    renderInTheme(
      <AutocompleteView>
        <span>slotted content</span>
      </AutocompleteView>,
    );
    expect(screen.getByText('slotted content')).toBeInTheDocument();
  });
});
