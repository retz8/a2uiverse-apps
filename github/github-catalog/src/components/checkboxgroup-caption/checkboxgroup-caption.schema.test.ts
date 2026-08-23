import {describe, it, expect} from 'vitest';
import {CheckboxGroupCaptionApi} from './checkboxgroup-caption.schema';

describe('CheckboxGroupCaptionApi.schema', () => {
  it('accepts a literal text caption', () => {
    expect(
      CheckboxGroupCaptionApi.schema.safeParse({text: 'Choose which events email you'}).success,
    ).toBe(true);
  });

  it('accepts a bound (path) text caption', () => {
    expect(CheckboxGroupCaptionApi.schema.safeParse({text: {path: '/caption'}}).success).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(CheckboxGroupCaptionApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(CheckboxGroupCaptionApi.schema.safeParse({text: 'T', id: 'x'}).success).toBe(false);
  });
});
