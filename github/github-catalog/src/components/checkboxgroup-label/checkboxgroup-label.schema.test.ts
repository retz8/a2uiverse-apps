import {describe, it, expect} from 'vitest';
import {CheckboxGroupLabelApi} from './checkboxgroup-label.schema';

describe('CheckboxGroupLabelApi.schema', () => {
  it('accepts a literal text label', () => {
    expect(CheckboxGroupLabelApi.schema.safeParse({text: 'Notifications'}).success).toBe(true);
  });

  it('accepts a bound (path) text label', () => {
    expect(CheckboxGroupLabelApi.schema.safeParse({text: {path: '/groupLabel'}}).success).toBe(
      true,
    );
  });

  it('accepts the full surface', () => {
    expect(
      CheckboxGroupLabelApi.schema.safeParse({text: 'Notifications', visuallyHidden: true}).success,
    ).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(CheckboxGroupLabelApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      CheckboxGroupLabelApi.schema.safeParse({text: 'T', requiredIndicator: true}).success,
    ).toBe(false);
  });
});
