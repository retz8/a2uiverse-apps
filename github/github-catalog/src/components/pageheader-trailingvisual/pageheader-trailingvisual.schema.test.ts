import {describe, it, expect} from 'vitest';
import {PageHeaderTrailingVisualApi} from './pageheader-trailingvisual.schema';

describe('PageHeaderTrailingVisualApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderTrailingVisualApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderTrailingVisualApi.schema.safeParse({children: ['a', 'b'], hidden: true}).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderTrailingVisualApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderTrailingVisualApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderTrailingVisualApi.schema.safeParse({hidden: {narrow: true, regular: false}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderTrailingVisualApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderTrailingVisualApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
