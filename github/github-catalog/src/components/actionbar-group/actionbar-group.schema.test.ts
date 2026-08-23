import {describe, it, expect} from 'vitest';
import {ActionBarGroupApi} from './actionbar-group.schema';

describe('ActionBarGroupApi.schema', () => {
  it('accepts a minimal valid ActionBar.Group (children optional)', () => {
    expect(ActionBarGroupApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(ActionBarGroupApi.schema.safeParse({children: ['b1', 'b2', 'b3']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      ActionBarGroupApi.schema.safeParse({children: {componentId: 'tpl', path: '/actions'}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionBarGroupApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });
});
