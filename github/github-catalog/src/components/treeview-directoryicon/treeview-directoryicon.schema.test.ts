import {describe, it, expect} from 'vitest';
import {TreeViewDirectoryIconApi} from './treeview-directoryicon.schema';

describe('TreeViewDirectoryIconApi.schema', () => {
  it('accepts the empty props object (zero-prop leaf)', () => {
    expect(TreeViewDirectoryIconApi.schema.safeParse({}).success).toBe(true);
  });

  it('rejects any prop (strict, zero-prop surface)', () => {
    expect(TreeViewDirectoryIconApi.schema.safeParse({open: true}).success).toBe(false);
  });
});
