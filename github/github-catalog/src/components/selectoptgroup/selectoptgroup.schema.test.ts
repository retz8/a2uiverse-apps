import {describe, it, expect} from 'vitest';
import {SelectOptGroupApi} from './selectoptgroup.schema';

describe('SelectOptGroupApi.schema', () => {
  it('accepts a minimal valid SelectOptGroup (no props)', () => {
    expect(SelectOptGroupApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = SelectOptGroupApi.schema.safeParse({
      children: ['o1', 'o2'],
      label: 'Open',
      disabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(SelectOptGroupApi.schema.safeParse({label: 'Open', id: 'grp'}).success).toBe(false);
  });

  it('accepts a data-binding for label (DynamicString)', () => {
    expect(SelectOptGroupApi.schema.safeParse({label: {path: './name'}}).success).toBe(true);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      SelectOptGroupApi.schema.safeParse({label: 'Open', disabled: {path: '/locked'}}).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      SelectOptGroupApi.schema.safeParse({
        label: 'Open',
        children: {componentId: 'opt', path: '/labels'},
      }).success,
    ).toBe(true);
  });
});
