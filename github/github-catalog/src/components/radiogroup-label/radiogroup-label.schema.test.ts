import {describe, it, expect} from 'vitest';
import {RadioGroupLabelApi} from './radiogroup-label.schema';

describe('RadioGroupLabelApi.schema', () => {
  it('accepts a literal text label', () => {
    expect(RadioGroupLabelApi.schema.safeParse({text: 'Choices'}).success).toBe(true);
  });

  it('accepts a bound (path) text label', () => {
    expect(RadioGroupLabelApi.schema.safeParse({text: {path: '/labelText'}}).success).toBe(true);
  });

  it('accepts the full surface', () => {
    expect(
      RadioGroupLabelApi.schema.safeParse({text: 'Choices', visuallyHidden: true}).success,
    ).toBe(true);
  });

  it('rejects a missing required text', () => {
    expect(RadioGroupLabelApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(RadioGroupLabelApi.schema.safeParse({text: 'T', requiredIndicator: true}).success).toBe(
      false,
    );
  });
});
