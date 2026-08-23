import {describe, it, expect} from 'vitest';
import {TreeViewSubTreeApi} from './treeview-subtree.schema';

describe('TreeViewSubTreeApi.schema', () => {
  it('accepts a minimal valid SubTree (every prop optional)', () => {
    expect(TreeViewSubTreeApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface SubTree', () => {
    expect(
      TreeViewSubTreeApi.schema.safeParse({
        children: ['child-a', 'child-b'],
        state: 'loading',
        count: 3,
        accessibility: {label: 'Contents'},
      }).success,
    ).toBe(true);
  });

  it('accepts each state enum value', () => {
    for (const state of ['initial', 'loading', 'done', 'error']) {
      expect(TreeViewSubTreeApi.schema.safeParse({state}).success).toBe(true);
    }
  });

  it('rejects an out-of-enum state', () => {
    expect(TreeViewSubTreeApi.schema.safeParse({state: 'pending'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TreeViewSubTreeApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });
});
