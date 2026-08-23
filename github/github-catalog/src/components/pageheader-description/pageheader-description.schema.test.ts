import {describe, it, expect} from 'vitest';
import {PageHeaderDescriptionApi} from './pageheader-description.schema';

describe('PageHeaderDescriptionApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderDescriptionApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderDescriptionApi.schema.safeParse({children: ['a', 'b'], hidden: true}).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderDescriptionApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderDescriptionApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderDescriptionApi.schema.safeParse({hidden: {narrow: true, regular: false}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderDescriptionApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderDescriptionApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
