import {describe, it, expect} from 'vitest';
import {ActionBarDividerApi} from './actionbar-divider.schema';

describe('ActionBarDividerApi.schema', () => {
  it('accepts an empty object (zero-prop)', () => {
    expect(ActionBarDividerApi.schema.safeParse({}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionBarDividerApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });
});
