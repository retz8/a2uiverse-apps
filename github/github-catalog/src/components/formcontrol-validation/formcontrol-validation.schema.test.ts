import {describe, it, expect} from 'vitest';
import {FormControlValidationApi} from './formcontrol-validation.schema';

describe('FormControlValidationApi.schema', () => {
  it('accepts a literal error variant', () => {
    expect(
      FormControlValidationApi.schema.safeParse({
        text: 'That name is already taken',
        variant: 'error',
      }).success,
    ).toBe(true);
  });

  it('accepts a literal success variant', () => {
    expect(
      FormControlValidationApi.schema.safeParse({text: 'Name is available', variant: 'success'})
        .success,
    ).toBe(true);
  });

  it('accepts a bound (path) variant', () => {
    expect(
      FormControlValidationApi.schema.safeParse({text: 'Message', variant: {path: '/status'}})
        .success,
    ).toBe(true);
  });

  it('accepts a bound (path) text', () => {
    expect(
      FormControlValidationApi.schema.safeParse({text: {path: '/msg'}, variant: 'error'}).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum variant', () => {
    expect(FormControlValidationApi.schema.safeParse({text: 'M', variant: 'warning'}).success).toBe(
      false,
    );
  });

  it('rejects a missing required text', () => {
    expect(FormControlValidationApi.schema.safeParse({variant: 'error'}).success).toBe(false);
  });

  it('rejects a missing required variant', () => {
    expect(FormControlValidationApi.schema.safeParse({text: 'M'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      FormControlValidationApi.schema.safeParse({text: 'M', variant: 'error', id: 'x'}).success,
    ).toBe(false);
  });
});
