import {describe, it, expect} from 'vitest';
import {ActionListDescriptionApi} from './actionlist-description.schema';

describe('ActionListDescriptionApi.schema', () => {
  it('accepts a minimal valid Description (text only)', () => {
    expect(ActionListDescriptionApi.schema.safeParse({text: 'opened 2 days ago'}).success).toBe(
      true,
    );
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListDescriptionApi.schema.safeParse({
        text: 'A longer description',
        variant: 'block',
        truncate: true,
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(ActionListDescriptionApi.schema.safeParse({variant: 'inline'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(ActionListDescriptionApi.schema.safeParse({text: {path: '/desc'}}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListDescriptionApi.schema.safeParse({text: 'x', color: 'red'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum variant', () => {
    expect(ActionListDescriptionApi.schema.safeParse({text: 'x', variant: 'aside'}).success).toBe(
      false,
    );
  });
});
