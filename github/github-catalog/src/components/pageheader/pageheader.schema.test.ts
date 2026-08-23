import {describe, it, expect} from 'vitest';
import {PageHeaderApi} from './pageheader.schema';

describe('PageHeaderApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderApi.schema.safeParse({
        children: ['a', 'b'],
        as: 'header',
        role: 'banner',
        hasBorder: true,
        'aria-label': 'Page header',
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(PageHeaderApi.schema.safeParse({as: 'section'}).success).toBe(false);
  });

  it('accepts a data-binding for aria-label (DynamicString)', () => {
    expect(PageHeaderApi.schema.safeParse({'aria-label': {path: '/label'}}).success).toBe(true);
  });
});
