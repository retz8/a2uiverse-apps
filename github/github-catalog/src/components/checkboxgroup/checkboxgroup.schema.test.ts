import {describe, it, expect} from 'vitest';
import {CheckboxGroupApi} from './checkboxgroup.schema';

describe('CheckboxGroupApi.schema', () => {
  it('accepts a minimal valid CheckboxGroup (children only)', () => {
    expect(CheckboxGroupApi.schema.safeParse({children: ['label', 'option']}).success).toBe(true);
  });

  it('accepts a full-surface CheckboxGroup', () => {
    expect(
      CheckboxGroupApi.schema.safeParse({
        children: ['label', 'caption', 'validation', 'option'],
        disabled: true,
        required: true,
      }).success,
    ).toBe(true);
  });

  it('rejects an id prop (id is a framework-owned envelope field, not an authorable prop)', () => {
    expect(CheckboxGroupApi.schema.safeParse({children: ['option'], id: 'group'}).success).toBe(
      false,
    );
  });

  it('accepts a bound (path) disabled', () => {
    expect(
      CheckboxGroupApi.schema.safeParse({children: ['option'], disabled: {path: '/disabled'}})
        .success,
    ).toBe(true);
  });

  it('rejects missing required children', () => {
    expect(CheckboxGroupApi.schema.safeParse({required: true}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(CheckboxGroupApi.schema.safeParse({children: ['option'], className: 'x'}).success).toBe(
      false,
    );
  });
});
