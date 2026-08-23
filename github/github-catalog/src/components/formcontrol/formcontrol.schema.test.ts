import {describe, it, expect} from 'vitest';
import {FormControlApi} from './formcontrol.schema';

describe('FormControlApi.schema', () => {
  it('accepts a minimal valid FormControl (children only)', () => {
    expect(FormControlApi.schema.safeParse({children: ['label', 'input']}).success).toBe(true);
  });

  it('accepts a full-surface FormControl', () => {
    expect(
      FormControlApi.schema.safeParse({
        children: ['label', 'caption', 'validation', 'input'],
        disabled: true,
        layout: 'horizontal',
        required: true,
      }).success,
    ).toBe(true);
  });

  it('rejects an id prop (id is a framework-owned envelope field, not an authorable prop)', () => {
    expect(FormControlApi.schema.safeParse({children: ['input'], id: 'repo-name'}).success).toBe(
      false,
    );
  });

  it('accepts a bound (path) disabled', () => {
    expect(
      FormControlApi.schema.safeParse({children: ['input'], disabled: {path: '/disabled'}}).success,
    ).toBe(true);
  });

  it('rejects missing required children', () => {
    expect(FormControlApi.schema.safeParse({required: true}).success).toBe(false);
  });

  it('rejects an out-of-enum layout', () => {
    expect(FormControlApi.schema.safeParse({children: ['input'], layout: 'inline'}).success).toBe(
      false,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(FormControlApi.schema.safeParse({children: ['input'], className: 'x'}).success).toBe(
      false,
    );
  });
});
