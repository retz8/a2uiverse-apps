import {describe, it, expect} from 'vitest';
import {AutocompleteMenuApi} from './autocomplete-menu.schema';

const minimalItem = {id: 'bug', text: 'Bug'};

describe('AutocompleteMenuApi.schema', () => {
  it('accepts a minimal valid Autocomplete.Menu (items only)', () => {
    expect(AutocompleteMenuApi.schema.safeParse({items: [minimalItem]}).success).toBe(true);
  });

  it('accepts an empty items array', () => {
    expect(AutocompleteMenuApi.schema.safeParse({items: []}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = AutocompleteMenuApi.schema.safeParse({
      items: [
        {id: 'bug', text: 'Bug', leadingVisual: 'bug-icon', trailingVisual: 'tv', disabled: false},
        {id: 'wont', text: 'Wontfix', variant: 'danger'},
      ],
      selectedItemIds: ['bug'],
      selectionVariant: 'multiple',
      emptyStateText: 'No labels',
      loading: true,
      addNewItem: {
        id: 'add-new',
        text: 'Create new label',
        action: {event: {name: 'create-label', context: {}}},
      },
      accessibility: {label: 'Labels'},
    });
    expect(result.success).toBe(true);
  });

  it('requires items', () => {
    expect(AutocompleteMenuApi.schema.safeParse({selectionVariant: 'single'}).success).toBe(false);
  });

  it('requires an id on each item', () => {
    expect(AutocompleteMenuApi.schema.safeParse({items: [{text: 'Bug'}]}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [minimalItem], filterFn: 'x'}).success,
    ).toBe(false);
  });

  it('rejects unknown item props (item strict)', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [{id: 'bug', selected: true}]}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum selectionVariant values', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [minimalItem], selectionVariant: 'some'})
        .success,
    ).toBe(false);
  });

  it('rejects out-of-enum item variant values', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [{id: 'bug', variant: 'warning'}]}).success,
    ).toBe(false);
  });

  it('accepts a literal string[] for selectedItemIds', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [minimalItem], selectedItemIds: ['bug', 'docs']})
        .success,
    ).toBe(true);
  });

  it('accepts a data-binding for selectedItemIds (the array|DataBinding union)', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [minimalItem], selectedItemIds: {path: '/sel'}})
        .success,
    ).toBe(true);
  });

  it('accepts a data-binding for emptyStateText (DynamicString)', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [minimalItem], emptyStateText: {path: '/empty'}})
        .success,
    ).toBe(true);
  });

  it('accepts a data-binding for loading (DynamicBoolean)', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({items: [minimalItem], loading: {path: '/loading'}})
        .success,
    ).toBe(true);
  });

  it('requires an action on addNewItem', () => {
    expect(
      AutocompleteMenuApi.schema.safeParse({
        items: [minimalItem],
        addNewItem: {id: 'add-new', text: 'Create'},
      }).success,
    ).toBe(false);
  });
});
