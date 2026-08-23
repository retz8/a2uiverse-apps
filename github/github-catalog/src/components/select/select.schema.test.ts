import {describe, it, expect} from 'vitest';
import {SelectApi} from './select.schema';

describe('SelectApi.schema', () => {
  it('accepts a minimal valid Select (value only)', () => {
    expect(SelectApi.schema.safeParse({value: 'feature'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = SelectApi.schema.safeParse({
      children: ['o1', 'o2', 'o3'],
      value: 'feature',
      placeholder: 'Choose a label',
      disabled: true,
      required: true,
      validationStatus: 'error',
      block: true,
      size: 'large',
      accessibility: {label: 'Label', description: 'Pick a label'},
    });
    expect(result.success).toBe(true);
  });

  it('requires value', () => {
    expect(SelectApi.schema.safeParse({placeholder: 'Choose a label'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SelectApi.schema.safeParse({value: 'feature', name: 'label'}).success).toBe(false);
  });

  it('rejects out-of-enum validationStatus values', () => {
    expect(
      SelectApi.schema.safeParse({value: 'feature', validationStatus: 'warning'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum size values', () => {
    expect(SelectApi.schema.safeParse({value: 'feature', size: 'huge'}).success).toBe(false);
  });

  it('accepts a data-binding for value (DynamicString)', () => {
    expect(SelectApi.schema.safeParse({value: {path: '/selected'}}).success).toBe(true);
  });

  it('accepts a data-binding for placeholder (DynamicString)', () => {
    expect(
      SelectApi.schema.safeParse({value: 'feature', placeholder: {path: '/hint'}}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      SelectApi.schema.safeParse({value: 'feature', disabled: {path: '/locked'}}).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      SelectApi.schema.safeParse({
        value: 'feature',
        children: {componentId: 'opt', path: '/labels'},
      }).success,
    ).toBe(true);
  });
});
