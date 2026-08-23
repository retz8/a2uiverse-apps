import {describe, it, expect} from 'vitest';
import {DialogFooterApi} from './dialog-footer.schema';

describe('DialogFooterApi.schema', () => {
  it('accepts an empty footer (children optional)', () => {
    expect(DialogFooterApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a footer with children', () => {
    expect(DialogFooterApi.schema.safeParse({children: ['buttons']}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(DialogFooterApi.schema.safeParse({children: ['t'], color: 'red'}).success).toBe(false);
  });
});
