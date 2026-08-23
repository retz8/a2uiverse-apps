import {describe, it, expect} from 'vitest';
import {AutocompleteOverlayApi} from './autocomplete-overlay.schema';

describe('AutocompleteOverlayApi.schema', () => {
  it('accepts a minimal valid Autocomplete.Overlay (no props — children optional)', () => {
    expect(AutocompleteOverlayApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList for children', () => {
    expect(AutocompleteOverlayApi.schema.safeParse({children: ['menu']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      AutocompleteOverlayApi.schema.safeParse({children: {componentId: 'm', path: '/menus'}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict) — including the dropped OverlayProps spread', () => {
    expect(AutocompleteOverlayApi.schema.safeParse({width: 'medium'}).success).toBe(false);
    expect(AutocompleteOverlayApi.schema.safeParse({visibility: 'visible'}).success).toBe(false);
  });
});
