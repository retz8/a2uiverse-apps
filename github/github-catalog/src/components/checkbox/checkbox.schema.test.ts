import {describe, it, expect} from 'vitest';
import {CheckboxApi} from './checkbox.schema';

describe('CheckboxApi.schema', () => {
  it('accepts a minimal valid Checkbox (checked only)', () => {
    expect(CheckboxApi.schema.safeParse({checked: false}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      CheckboxApi.schema.safeParse({
        checked: true,
        indeterminate: false,
        disabled: false,
        required: true,
        validationStatus: 'error',
        value: 'newsletter',
        accessibility: {label: 'Subscribe to the newsletter'},
      }).success,
    ).toBe(true);
  });

  it('requires checked', () => {
    expect(CheckboxApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(CheckboxApi.schema.safeParse({checked: false, color: 'red'}).success).toBe(false);
  });

  it('rejects out-of-enum validationStatus', () => {
    expect(
      CheckboxApi.schema.safeParse({checked: false, validationStatus: 'warning'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for checked (DynamicBoolean)', () => {
    expect(CheckboxApi.schema.safeParse({checked: {path: '/notify'}}).success).toBe(true);
  });

  it('accepts a data-binding for indeterminate (DynamicBoolean)', () => {
    expect(
      CheckboxApi.schema.safeParse({checked: false, indeterminate: {path: '/partial'}}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      CheckboxApi.schema.safeParse({checked: false, disabled: {path: '/locked'}}).success,
    ).toBe(true);
  });
});
