import {describe, it, expect} from 'vitest';
import {PageHeaderTrailingActionApi} from './pageheader-trailingaction.schema';

describe('PageHeaderTrailingActionApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderTrailingActionApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderTrailingActionApi.schema.safeParse({children: ['a', 'b'], hidden: true}).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderTrailingActionApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderTrailingActionApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderTrailingActionApi.schema.safeParse({hidden: {narrow: true, regular: false}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderTrailingActionApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderTrailingActionApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
