import {describe, it, expect} from 'vitest';
import {BreadcrumbsItemApi} from './breadcrumbsitem.schema';

describe('BreadcrumbsItemApi.schema', () => {
  it('accepts a minimal valid item (label only)', () => {
    expect(BreadcrumbsItemApi.schema.safeParse({label: 'Home'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = BreadcrumbsItemApi.schema.safeParse({
      label: 'Settings',
      href: '/settings',
      selected: true,
      target: '_blank',
      accessibility: {label: 'Go to settings'},
    });
    expect(result.success).toBe(true);
  });

  it('requires label', () => {
    expect(BreadcrumbsItemApi.schema.safeParse({href: '/settings'}).success).toBe(false);
  });

  it('allows omitting href (current-page crumb)', () => {
    expect(BreadcrumbsItemApi.schema.safeParse({label: 'Settings', selected: true}).success).toBe(
      true,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(BreadcrumbsItemApi.schema.safeParse({label: 'Home', as: 'button'}).success).toBe(false);
  });

  it('rejects an out-of-enum target', () => {
    expect(BreadcrumbsItemApi.schema.safeParse({label: 'Home', target: '_top'}).success).toBe(
      false,
    );
  });

  it('accepts a data-binding for label (DynamicString)', () => {
    expect(BreadcrumbsItemApi.schema.safeParse({label: {path: './name'}}).success).toBe(true);
  });

  it('accepts a data-binding for href (DynamicString)', () => {
    expect(
      BreadcrumbsItemApi.schema.safeParse({label: 'Home', href: {path: './url'}}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for selected (DynamicBoolean)', () => {
    expect(
      BreadcrumbsItemApi.schema.safeParse({label: 'Home', selected: {path: './current'}}).success,
    ).toBe(true);
  });
});
