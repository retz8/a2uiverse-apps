import {describe, it, expect} from 'vitest';
import {SelectOptionApi} from './selectoption.schema';

describe('SelectOptionApi.schema', () => {
  it('accepts a minimal valid SelectOption (text + value)', () => {
    expect(SelectOptionApi.schema.safeParse({text: 'Bug', value: 'bug'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = SelectOptionApi.schema.safeParse({
      text: 'Bug',
      value: 'bug',
      disabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(SelectOptionApi.schema.safeParse({value: 'bug'}).success).toBe(false);
  });

  it('requires value', () => {
    expect(SelectOptionApi.schema.safeParse({text: 'Bug'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      SelectOptionApi.schema.safeParse({text: 'Bug', value: 'bug', selected: true}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(SelectOptionApi.schema.safeParse({text: {path: './label'}, value: 'bug'}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for value (DynamicString)', () => {
    expect(SelectOptionApi.schema.safeParse({text: 'Bug', value: {path: './value'}}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      SelectOptionApi.schema.safeParse({text: 'Bug', value: 'bug', disabled: {path: '/locked'}})
        .success,
    ).toBe(true);
  });
});
