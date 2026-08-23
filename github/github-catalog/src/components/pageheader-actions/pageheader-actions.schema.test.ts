import {describe, it, expect} from 'vitest';
import {PageHeaderActionsApi} from './pageheader-actions.schema';

describe('PageHeaderActionsApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderActionsApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderActionsApi.schema.safeParse({children: ['a', 'b'], hidden: true}).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderActionsApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderActionsApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderActionsApi.schema.safeParse({hidden: {narrow: true, regular: false}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderActionsApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderActionsApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
