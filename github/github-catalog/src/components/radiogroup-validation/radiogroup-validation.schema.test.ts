import {describe, it, expect} from 'vitest';
import {RadioGroupValidationApi} from './radiogroup-validation.schema';

describe('RadioGroupValidationApi.schema', () => {
  it('accepts a literal error variant', () => {
    expect(
      RadioGroupValidationApi.schema.safeParse({text: 'Please select an option', variant: 'error'})
        .success,
    ).toBe(true);
  });

  it('accepts a literal success variant', () => {
    expect(
      RadioGroupValidationApi.schema.safeParse({text: 'Looks good', variant: 'success'}).success,
    ).toBe(true);
  });

  it('accepts a bound (path) variant', () => {
    expect(
      RadioGroupValidationApi.schema.safeParse({text: 'Message', variant: {path: '/status'}})
        .success,
    ).toBe(true);
  });

  it('accepts a bound (path) text', () => {
    expect(
      RadioGroupValidationApi.schema.safeParse({text: {path: '/msg'}, variant: 'error'}).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum variant', () => {
    expect(RadioGroupValidationApi.schema.safeParse({text: 'M', variant: 'warning'}).success).toBe(
      false,
    );
  });

  it('rejects a missing required text', () => {
    expect(RadioGroupValidationApi.schema.safeParse({variant: 'error'}).success).toBe(false);
  });

  it('rejects a missing required variant', () => {
    expect(RadioGroupValidationApi.schema.safeParse({text: 'M'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      RadioGroupValidationApi.schema.safeParse({text: 'M', variant: 'error', id: 'x'}).success,
    ).toBe(false);
  });
});
