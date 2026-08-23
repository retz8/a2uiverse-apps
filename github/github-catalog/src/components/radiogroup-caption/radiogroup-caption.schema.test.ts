import {describe, it, expect} from 'vitest';
import {RadioGroupCaptionApi} from './radiogroup-caption.schema';

describe('RadioGroupCaptionApi.schema', () => {
  it('accepts a literal text caption', () => {
    expect(RadioGroupCaptionApi.schema.safeParse({text: 'Select one option'}).success).toBe(true);
  });

  it('accepts a bound (path) text caption', () => {
    expect(RadioGroupCaptionApi.schema.safeParse({text: {path: '/caption'}}).success).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(RadioGroupCaptionApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(RadioGroupCaptionApi.schema.safeParse({text: 'T', id: 'x'}).success).toBe(false);
  });
});
