import {describe, it, expect} from 'vitest';
import {CheckboxGroupValidationApi} from './checkboxgroup-validation.schema';

describe('CheckboxGroupValidationApi.schema', () => {
  it('accepts a literal error variant', () => {
    expect(
      CheckboxGroupValidationApi.schema.safeParse({
        text: 'Select at least one option',
        variant: 'error',
      }).success,
    ).toBe(true);
  });

  it('accepts a literal success variant', () => {
    expect(
      CheckboxGroupValidationApi.schema.safeParse({text: 'Preferences saved', variant: 'success'})
        .success,
    ).toBe(true);
  });

  it('accepts a bound (path) variant', () => {
    expect(
      CheckboxGroupValidationApi.schema.safeParse({text: 'Message', variant: {path: '/status'}})
        .success,
    ).toBe(true);
  });

  it('accepts a bound (path) text', () => {
    expect(
      CheckboxGroupValidationApi.schema.safeParse({text: {path: '/msg'}, variant: 'error'}).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum variant', () => {
    expect(
      CheckboxGroupValidationApi.schema.safeParse({text: 'M', variant: 'warning'}).success,
    ).toBe(false);
  });

  it('rejects a missing required text', () => {
    expect(CheckboxGroupValidationApi.schema.safeParse({variant: 'error'}).success).toBe(false);
  });

  it('rejects a missing required variant', () => {
    expect(CheckboxGroupValidationApi.schema.safeParse({text: 'M'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      CheckboxGroupValidationApi.schema.safeParse({text: 'M', variant: 'error', id: 'x'}).success,
    ).toBe(false);
  });
});
