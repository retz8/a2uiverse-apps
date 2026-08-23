import {describe, it, expect} from 'vitest';
import {PageHeaderBreadcrumbsApi} from './pageheader-breadcrumbs.schema';

describe('PageHeaderBreadcrumbsApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderBreadcrumbsApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderBreadcrumbsApi.schema.safeParse({children: ['a', 'b'], hidden: true}).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderBreadcrumbsApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderBreadcrumbsApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderBreadcrumbsApi.schema.safeParse({hidden: {narrow: true, regular: false}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderBreadcrumbsApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderBreadcrumbsApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
