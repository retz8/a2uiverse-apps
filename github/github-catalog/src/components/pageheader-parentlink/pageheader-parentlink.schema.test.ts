import {describe, it, expect} from 'vitest';
import {PageHeaderParentLinkApi} from './pageheader-parentlink.schema';

describe('PageHeaderParentLinkApi.schema', () => {
  it('accepts a minimal valid ParentLink (text + href)', () => {
    expect(
      PageHeaderParentLinkApi.schema.safeParse({text: 'Issues', href: '/issues'}).success,
    ).toBe(true);
  });

  it('accepts a full-surface ParentLink', () => {
    expect(
      PageHeaderParentLinkApi.schema.safeParse({
        text: 'Issues',
        href: '/issues',
        'aria-label': 'Back to issues',
        hidden: true,
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(PageHeaderParentLinkApi.schema.safeParse({href: '/issues'}).success).toBe(false);
  });

  it('requires href', () => {
    expect(PageHeaderParentLinkApi.schema.safeParse({text: 'Issues'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      PageHeaderParentLinkApi.schema.safeParse({text: 'x', href: '/', target: '_blank'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(
      PageHeaderParentLinkApi.schema.safeParse({text: {path: '/label'}, href: '/issues'}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for href (DynamicString)', () => {
    expect(
      PageHeaderParentLinkApi.schema.safeParse({text: 'Issues', href: {path: '/url'}}).success,
    ).toBe(true);
  });
});
