import {describe, it, expect} from 'vitest';
import {UnderlineNavApi} from './underline-nav.schema';

describe('UnderlineNavApi.schema', () => {
  it('accepts a minimal valid UnderlineNav (required children + aria-label)', () => {
    expect(
      UnderlineNavApi.schema.safeParse({children: ['t0', 't1'], 'aria-label': 'Repository'})
        .success,
    ).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = UnderlineNavApi.schema.safeParse({
      children: ['t0'],
      'aria-label': 'Repository',
      loadingCounters: true,
      variant: 'flush',
    });
    expect(result.success).toBe(true);
  });

  it('requires children', () => {
    expect(UnderlineNavApi.schema.safeParse({'aria-label': 'Repository'}).success).toBe(false);
  });

  it('requires aria-label', () => {
    expect(UnderlineNavApi.schema.safeParse({children: ['t0']}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(
      UnderlineNavApi.schema.safeParse({
        children: ['t0'],
        'aria-label': 'Repository',
        variant: 'compact',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      UnderlineNavApi.schema.safeParse({children: ['t0'], 'aria-label': 'Repository', as: 'nav'})
        .success,
    ).toBe(false);
  });

  it('accepts a data-binding for aria-label (DynamicString)', () => {
    expect(
      UnderlineNavApi.schema.safeParse({children: ['t0'], 'aria-label': {path: '/label'}}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for loadingCounters (DynamicBoolean)', () => {
    expect(
      UnderlineNavApi.schema.safeParse({
        children: ['t0'],
        'aria-label': 'Repository',
        loadingCounters: {path: '/loading'},
      }).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      UnderlineNavApi.schema.safeParse({
        children: {componentId: 'tab', path: '/tabs'},
        'aria-label': 'Repository',
      }).success,
    ).toBe(true);
  });
});
