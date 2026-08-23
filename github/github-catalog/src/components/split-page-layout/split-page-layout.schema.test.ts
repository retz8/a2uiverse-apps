import {describe, it, expect} from 'vitest';
import {SplitPageLayoutApi} from './split-page-layout.schema';

describe('SplitPageLayoutApi.schema', () => {
  it('accepts a minimal valid SplitPageLayout (no slots — all optional)', () => {
    expect(SplitPageLayoutApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface (all five region slots)', () => {
    expect(
      SplitPageLayoutApi.schema.safeParse({
        header: 'h',
        content: 'c',
        pane: 'p',
        sidebar: 's',
        footer: 'f',
      }).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(SplitPageLayoutApi.schema.safeParse({content: 'c', padding: 'normal'}).success).toBe(
      false,
    );
  });

  it('rejects a non-string ComponentId slot', () => {
    expect(SplitPageLayoutApi.schema.safeParse({header: 42}).success).toBe(false);
  });
});
