import {describe, it, expect} from 'vitest';
import {DialogHeaderApi} from './dialog-header.schema';

describe('DialogHeaderApi.schema', () => {
  it('accepts an empty header (children optional)', () => {
    expect(DialogHeaderApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a header with children', () => {
    expect(
      DialogHeaderApi.schema.safeParse({children: ['title', 'subtitle', 'close']}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(DialogHeaderApi.schema.safeParse({children: ['t'], color: 'red'}).success).toBe(false);
  });
});
