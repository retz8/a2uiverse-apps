import {describe, it, expect} from 'vitest';
import {AutocompleteApi} from './autocomplete.schema';

describe('AutocompleteApi.schema', () => {
  it('accepts a minimal valid Autocomplete (no props — children optional)', () => {
    expect(AutocompleteApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList for children', () => {
    expect(AutocompleteApi.schema.safeParse({children: ['input', 'overlay']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      AutocompleteApi.schema.safeParse({children: {componentId: 'row', path: '/items'}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict) — including the dropped `id`', () => {
    expect(AutocompleteApi.schema.safeParse({id: 'ac'}).success).toBe(false);
  });
});
