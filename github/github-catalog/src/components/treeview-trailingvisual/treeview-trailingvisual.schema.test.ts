import {describe, it, expect} from 'vitest';
import {TreeViewTrailingVisualApi} from './treeview-trailingvisual.schema';

describe('TreeViewTrailingVisualApi.schema', () => {
  it('accepts a minimal valid TrailingVisual (child only)', () => {
    expect(TreeViewTrailingVisualApi.schema.safeParse({child: 'glyph'}).success).toBe(true);
  });

  it('accepts a full-surface TrailingVisual', () => {
    expect(
      TreeViewTrailingVisualApi.schema.safeParse({child: 'glyph', label: 'Changed'}).success,
    ).toBe(true);
  });

  it('rejects a missing required child', () => {
    expect(TreeViewTrailingVisualApi.schema.safeParse({label: 'Changed'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TreeViewTrailingVisualApi.schema.safeParse({child: 'glyph', color: 'red'}).success).toBe(
      false,
    );
  });
});
