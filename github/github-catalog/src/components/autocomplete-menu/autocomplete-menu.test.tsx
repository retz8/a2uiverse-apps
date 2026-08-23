import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Autocomplete as PrimerAutocomplete} from '@primer/react';
import {AutocompleteMenuView} from './autocomplete-menu';

afterEach(cleanup);

const ITEMS = [
  {id: 'bug', text: 'Bug'},
  {id: 'feature', text: 'Feature'},
  {id: 'docs', text: 'Docs'},
];

// buildChild is unused for text-only items; icon slots aren't needed to exercise selection logic.
const buildChild = () => null;

// The Menu only renders its options once the Autocomplete context opens the menu (focus/type), so
// every test composes the real <Autocomplete> with a real <Autocomplete.Input> and the Menu.
function renderMenu(props: Partial<React.ComponentProps<typeof AutocompleteMenuView>> = {}): void {
  render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerAutocomplete>
          <PrimerAutocomplete.Input />
          <PrimerAutocomplete.Overlay>
            <AutocompleteMenuView items={ITEMS} buildChild={buildChild} {...props} />
          </PrimerAutocomplete.Overlay>
        </PrimerAutocomplete>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('AutocompleteMenuView', () => {
  it('renders the suggestion options once the menu opens on focus', () => {
    renderMenu();
    fireEvent.focus(screen.getByRole('combobox'));
    for (const label of ['Bug', 'Feature', 'Docs']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('writes the new selection back through setSelectedItemIds when an option is chosen', () => {
    const setSelectedItemIds = vi.fn();
    renderMenu({selectedItemIds: [], setSelectedItemIds});
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Feature'));
    expect(setSelectedItemIds).toHaveBeenCalledWith(['feature']);
  });

  it('fires the addNewItem action when the create-new row is chosen', () => {
    const action = vi.fn();
    renderMenu({addNewItem: {id: 'add-new', text: 'Create new label', action}});
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Create new label'));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-state text when no options match the typed input', () => {
    renderMenu({items: [], emptyStateText: 'No labels found'});
    fireEvent.focus(screen.getByRole('combobox'));
    expect(screen.getByText('No labels found')).toBeInTheDocument();
  });

  it('maps accessibility.label onto the listbox aria-labelledby', () => {
    renderMenu({accessibility: {label: 'Labels'}});
    fireEvent.focus(screen.getByRole('combobox'));
    // The menu wrapper is aria-hidden while closed, so query including hidden elements.
    expect(screen.getByRole('listbox', {hidden: true})).toHaveAttribute(
      'aria-labelledby',
      'Labels',
    );
  });
});
