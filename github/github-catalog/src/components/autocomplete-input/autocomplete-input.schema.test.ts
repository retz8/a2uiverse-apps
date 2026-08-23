import {describe, it, expect} from 'vitest';
import {AutocompleteInputApi} from './autocomplete-input.schema';

describe('AutocompleteInputApi.schema', () => {
  it('accepts a minimal valid Autocomplete.Input (no props — value is optional)', () => {
    expect(AutocompleteInputApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = AutocompleteInputApi.schema.safeParse({
      value: 'bug',
      placeholder: 'Search labels',
      disabled: true,
      required: true,
      validationStatus: 'error',
      type: 'search',
      loading: true,
      loaderPosition: 'trailing',
      loaderText: 'Loading',
      leadingVisual: 'lv',
      trailingVisual: 'tv',
      trailingAction: 'clear',
      size: 'large',
      block: true,
      contrast: true,
      monospace: true,
      characterLimit: 40,
      accessibility: {label: 'Labels', description: 'Type to filter'},
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown props (strict) — including the dropped `as`/`openOnFocus`', () => {
    expect(AutocompleteInputApi.schema.safeParse({as: 'div'}).success).toBe(false);
    expect(AutocompleteInputApi.schema.safeParse({openOnFocus: true}).success).toBe(false);
  });

  it('rejects out-of-enum type values (tightened to text/search)', () => {
    expect(AutocompleteInputApi.schema.safeParse({type: 'password'}).success).toBe(false);
    expect(AutocompleteInputApi.schema.safeParse({type: 'email'}).success).toBe(false);
    expect(AutocompleteInputApi.schema.safeParse({type: 'search'}).success).toBe(true);
  });

  it('rejects out-of-enum validationStatus values', () => {
    expect(AutocompleteInputApi.schema.safeParse({validationStatus: 'warning'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum size values', () => {
    expect(AutocompleteInputApi.schema.safeParse({size: 'huge'}).success).toBe(false);
  });

  it('accepts a data-binding for value (DynamicString)', () => {
    expect(AutocompleteInputApi.schema.safeParse({value: {path: '/query'}}).success).toBe(true);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(AutocompleteInputApi.schema.safeParse({disabled: {path: '/locked'}}).success).toBe(true);
  });

  it('accepts a data-binding for validationStatus (the enum|DataBinding union)', () => {
    expect(
      AutocompleteInputApi.schema.safeParse({validationStatus: {path: '/validation'}}).success,
    ).toBe(true);
  });
});
