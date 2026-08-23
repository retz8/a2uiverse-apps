import {describe, it, expect} from 'vitest';
import {PageHeaderContextAreaActionsApi} from './pageheader-contextareaactions.schema';

describe('PageHeaderContextAreaActionsApi.schema', () => {
  it('accepts a minimal valid component (every prop optional)', () => {
    expect(PageHeaderContextAreaActionsApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface component', () => {
    expect(
      PageHeaderContextAreaActionsApi.schema.safeParse({children: ['a', 'b'], hidden: true})
        .success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(PageHeaderContextAreaActionsApi.schema.safeParse({children: ['a', 'b']}).success).toBe(
      true,
    );
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderContextAreaActionsApi.schema.safeParse({
        children: {componentId: 'tpl', path: '/items'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive object for hidden', () => {
    expect(
      PageHeaderContextAreaActionsApi.schema.safeParse({hidden: {narrow: true, regular: false}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderContextAreaActionsApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-boolean hidden', () => {
    expect(PageHeaderContextAreaActionsApi.schema.safeParse({hidden: 'yes'}).success).toBe(false);
  });
});
