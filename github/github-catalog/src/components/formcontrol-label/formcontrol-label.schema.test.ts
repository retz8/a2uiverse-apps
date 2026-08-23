import {describe, it, expect} from 'vitest';
import {FormControlLabelApi} from './formcontrol-label.schema';

describe('FormControlLabelApi.schema', () => {
  it('accepts a literal text label', () => {
    expect(FormControlLabelApi.schema.safeParse({text: 'Repository name'}).success).toBe(true);
  });

  it('accepts a bound (path) text label', () => {
    expect(FormControlLabelApi.schema.safeParse({text: {path: '/labelText'}}).success).toBe(true);
  });

  it('accepts the full surface', () => {
    expect(
      FormControlLabelApi.schema.safeParse({
        text: 'Repository name',
        visuallyHidden: true,
        requiredIndicator: false,
        requiredText: 'required',
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(FormControlLabelApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(FormControlLabelApi.schema.safeParse({text: 'T', disabled: true}).success).toBe(false);
  });
});
