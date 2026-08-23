import {describe, it, expect} from 'vitest';
import {ActionListLeadingVisualApi} from './actionlist-leadingvisual.schema';

describe('ActionListLeadingVisualApi.schema', () => {
  it('accepts an empty LeadingVisual (children optional)', () => {
    expect(ActionListLeadingVisualApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(ActionListLeadingVisualApi.schema.safeParse({children: ['icon-1']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      ActionListLeadingVisualApi.schema.safeParse({children: {componentId: 'tpl', path: '/icons'}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListLeadingVisualApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });
});
