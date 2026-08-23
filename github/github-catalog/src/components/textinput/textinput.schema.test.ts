import {describe, it, expect} from 'vitest';
import {TextInputApi} from './textinput.schema';

describe('TextInputApi.schema', () => {
  it('accepts a minimal valid TextInput (value only)', () => {
    expect(TextInputApi.schema.safeParse({value: 'octocat'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = TextInputApi.schema.safeParse({
      value: 'octocat',
      placeholder: 'Search repositories',
      disabled: true,
      required: true,
      validationStatus: 'error',
      type: 'password',
      loading: true,
      loaderPosition: 'leading',
      loaderText: 'Loading',
      leadingVisual: 'lv',
      trailingVisual: 'tv',
      trailingAction: 'ta',
      size: 'large',
      block: true,
      contrast: true,
      monospace: true,
      characterLimit: 20,
      accessibility: {label: 'Search', description: 'Search repositories'},
    });
    expect(result.success).toBe(true);
  });

  it('requires value', () => {
    expect(TextInputApi.schema.safeParse({placeholder: 'hi'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', name: 'query'}).success).toBe(false);
  });

  it('rejects out-of-enum validationStatus values', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', validationStatus: 'warning'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum type values', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', type: 'color'}).success).toBe(false);
  });

  it('rejects out-of-enum loaderPosition values', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', loaderPosition: 'center'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum size values', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', size: 'xlarge'}).success).toBe(false);
  });

  it('accepts a data-binding for value (DynamicString)', () => {
    expect(TextInputApi.schema.safeParse({value: {path: '/query'}}).success).toBe(true);
  });

  it('accepts a data-binding for placeholder (DynamicString)', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', placeholder: {path: '/hint'}}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', disabled: {path: '/locked'}}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for loading (DynamicBoolean)', () => {
    expect(TextInputApi.schema.safeParse({value: 'hi', loading: {path: '/busy'}}).success).toBe(
      true,
    );
  });
});
