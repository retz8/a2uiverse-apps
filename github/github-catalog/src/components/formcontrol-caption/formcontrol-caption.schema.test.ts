import {describe, it, expect} from 'vitest';
import {FormControlCaptionApi} from './formcontrol-caption.schema';

describe('FormControlCaptionApi.schema', () => {
  it('accepts a literal text caption', () => {
    expect(
      FormControlCaptionApi.schema.safeParse({text: 'Choose a unique repository name'}).success,
    ).toBe(true);
  });

  it('accepts a bound (path) text caption', () => {
    expect(FormControlCaptionApi.schema.safeParse({text: {path: '/caption'}}).success).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(FormControlCaptionApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(FormControlCaptionApi.schema.safeParse({text: 'T', id: 'x'}).success).toBe(false);
  });
});
