import {describe, it, expect} from 'vitest';
import {TreeViewApi} from './treeview.schema';

describe('TreeViewApi.schema', () => {
  it('accepts a minimal valid TreeView (children only)', () => {
    expect(TreeViewApi.schema.safeParse({children: ['item']}).success).toBe(true);
  });

  it('accepts a full-surface TreeView', () => {
    expect(
      TreeViewApi.schema.safeParse({
        children: ['a', 'b'],
        flat: true,
        truncate: false,
        accessibility: {label: 'Files'},
      }).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      TreeViewApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(TreeViewApi.schema.safeParse({flat: true}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TreeViewApi.schema.safeParse({children: ['a'], color: 'red'}).success).toBe(false);
  });
});
