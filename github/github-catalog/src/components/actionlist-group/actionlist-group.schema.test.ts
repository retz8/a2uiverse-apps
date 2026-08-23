import {describe, it, expect} from 'vitest';
import {ActionListGroupApi} from './actionlist-group.schema';

describe('ActionListGroupApi.schema', () => {
  it('accepts a minimal valid Group (every prop optional)', () => {
    expect(ActionListGroupApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListGroupApi.schema.safeParse({
        children: ['item-1', 'item-2'],
        variant: 'filled',
        auxiliaryText: 'opened by octocat',
        selectionVariant: 'single',
        role: 'group',
      }).success,
    ).toBe(true);
  });

  it('accepts selectionVariant: false (disables selection for the group)', () => {
    expect(ActionListGroupApi.schema.safeParse({selectionVariant: false}).success).toBe(true);
  });

  it('accepts the radio selectionVariant (code is authority; doc table omits it)', () => {
    expect(ActionListGroupApi.schema.safeParse({selectionVariant: 'radio'}).success).toBe(true);
  });

  it('accepts a data-binding for auxiliaryText (DynamicString)', () => {
    expect(ActionListGroupApi.schema.safeParse({auxiliaryText: {path: '/text'}}).success).toBe(
      true,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListGroupApi.schema.safeParse({title: 'legacy'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(ActionListGroupApi.schema.safeParse({variant: 'outline'}).success).toBe(false);
  });

  it('rejects selectionVariant: true (only false is a valid literal)', () => {
    expect(ActionListGroupApi.schema.safeParse({selectionVariant: true}).success).toBe(false);
  });
});
