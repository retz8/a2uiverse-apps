import {describe, it, expect} from 'vitest';
import {ActionListTrailingVisualApi} from './actionlist-trailingvisual.schema';

describe('ActionListTrailingVisualApi.schema', () => {
  it('accepts an empty TrailingVisual (children optional)', () => {
    expect(ActionListTrailingVisualApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(ActionListTrailingVisualApi.schema.safeParse({children: ['counter-1']}).success).toBe(
      true,
    );
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      ActionListTrailingVisualApi.schema.safeParse({
        children: {componentId: 'tpl', path: '/counts'},
      }).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListTrailingVisualApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });
});
