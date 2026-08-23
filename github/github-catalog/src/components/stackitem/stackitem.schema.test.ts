import {describe, it, expect} from 'vitest';
import {StackItemApi} from './stackitem.schema';

describe('StackItemApi.schema', () => {
  it('accepts a minimal valid StackItem (every prop optional)', () => {
    expect(StackItemApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface StackItem', () => {
    expect(
      StackItemApi.schema.safeParse({
        children: ['a'],
        grow: true,
        shrink: false,
        as: 'li',
      }).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      StackItemApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('accepts a responsive object for grow', () => {
    expect(StackItemApi.schema.safeParse({grow: {narrow: true, regular: false}}).success).toBe(
      true,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(StackItemApi.schema.safeParse({flex: 1}).success).toBe(false);
  });

  it('rejects a non-boolean grow value', () => {
    expect(StackItemApi.schema.safeParse({grow: 'yes'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(StackItemApi.schema.safeParse({as: 'table'}).success).toBe(false);
  });
});
