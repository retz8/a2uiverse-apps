import {describe, it, expect} from 'vitest';
import {DialogTitleApi} from './dialog-title.schema';

describe('DialogTitleApi.schema', () => {
  it('accepts a literal text title', () => {
    expect(DialogTitleApi.schema.safeParse({text: 'Edit notification settings'}).success).toBe(
      true,
    );
  });

  it('accepts a bound (path) text title', () => {
    expect(DialogTitleApi.schema.safeParse({text: {path: '/dialog/title'}}).success).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(DialogTitleApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(DialogTitleApi.schema.safeParse({text: 'T', color: 'red'}).success).toBe(false);
  });
});
