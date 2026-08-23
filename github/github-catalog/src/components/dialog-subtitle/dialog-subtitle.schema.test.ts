import {describe, it, expect} from 'vitest';
import {DialogSubtitleApi} from './dialog-subtitle.schema';

describe('DialogSubtitleApi.schema', () => {
  it('accepts a literal text subtitle', () => {
    expect(DialogSubtitleApi.schema.safeParse({text: 'Changes apply to all devices'}).success).toBe(
      true,
    );
  });

  it('accepts a bound (path) text subtitle', () => {
    expect(DialogSubtitleApi.schema.safeParse({text: {path: '/dialog/subtitle'}}).success).toBe(
      true,
    );
  });

  it('rejects a missing required text', () => {
    expect(DialogSubtitleApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(DialogSubtitleApi.schema.safeParse({text: 'T', color: 'red'}).success).toBe(false);
  });
});
