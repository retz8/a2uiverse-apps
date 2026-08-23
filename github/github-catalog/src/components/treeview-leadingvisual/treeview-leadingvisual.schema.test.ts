import {describe, it, expect} from 'vitest';
import {TreeViewLeadingVisualApi} from './treeview-leadingvisual.schema';

describe('TreeViewLeadingVisualApi.schema', () => {
  it('accepts a minimal valid LeadingVisual (child only)', () => {
    expect(TreeViewLeadingVisualApi.schema.safeParse({child: 'glyph'}).success).toBe(true);
  });

  it('accepts a full-surface LeadingVisual', () => {
    expect(TreeViewLeadingVisualApi.schema.safeParse({child: 'glyph', label: 'File'}).success).toBe(
      true,
    );
  });

  it('rejects a missing required child', () => {
    expect(TreeViewLeadingVisualApi.schema.safeParse({label: 'File'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TreeViewLeadingVisualApi.schema.safeParse({child: 'glyph', color: 'red'}).success).toBe(
      false,
    );
  });
});
