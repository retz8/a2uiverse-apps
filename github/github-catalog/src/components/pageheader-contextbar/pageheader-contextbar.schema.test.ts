import {describe, it, expect} from 'vitest';
import {PageHeaderContextBarApi} from './pageheader-contextbar.schema';

describe('PageHeaderContextBarApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderContextBarApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderContextBarApi.schema.safeParse({children: ['a', 'b'], hidden: true}).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderContextBarApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderContextBarApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderContextBarApi.schema.safeParse({hidden: {narrow: true, regular: false}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderContextBarApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderContextBarApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
