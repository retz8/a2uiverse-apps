import {describe, it, expect} from 'vitest';
import {DialogBodyApi} from './dialog-body.schema';

describe('DialogBodyApi.schema', () => {
  it('accepts an empty body (children optional)', () => {
    expect(DialogBodyApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a body with children', () => {
    expect(DialogBodyApi.schema.safeParse({children: ['body-text']}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(DialogBodyApi.schema.safeParse({children: ['t'], color: 'red'}).success).toBe(false);
  });
});
