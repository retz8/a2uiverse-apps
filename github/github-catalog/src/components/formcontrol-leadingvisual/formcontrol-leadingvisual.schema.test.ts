import {describe, it, expect} from 'vitest';
import {FormControlLeadingVisualApi} from './formcontrol-leadingvisual.schema';

describe('FormControlLeadingVisualApi.schema', () => {
  it('accepts a component-id child', () => {
    expect(FormControlLeadingVisualApi.schema.safeParse({child: 'bell-icon'}).success).toBe(true);
  });

  it('rejects a missing required child', () => {
    expect(FormControlLeadingVisualApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      FormControlLeadingVisualApi.schema.safeParse({child: 'bell-icon', style: {}}).success,
    ).toBe(false);
  });
});
