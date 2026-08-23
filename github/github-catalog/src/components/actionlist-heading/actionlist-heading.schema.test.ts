import {describe, it, expect} from 'vitest';
import {ActionListHeadingApi} from './actionlist-heading.schema';

describe('ActionListHeadingApi.schema', () => {
  it('accepts a minimal valid Heading (text only)', () => {
    expect(ActionListHeadingApi.schema.safeParse({text: 'Repository actions'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListHeadingApi.schema.safeParse({
        text: 'Repository actions',
        as: 'h2',
        size: 'large',
        visuallyHidden: true,
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(ActionListHeadingApi.schema.safeParse({as: 'h3'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(ActionListHeadingApi.schema.safeParse({text: {path: '/title'}}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListHeadingApi.schema.safeParse({text: 'x', color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(ActionListHeadingApi.schema.safeParse({text: 'x', as: 'h7'}).success).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(ActionListHeadingApi.schema.safeParse({text: 'x', size: 'xl'}).success).toBe(false);
  });
});
