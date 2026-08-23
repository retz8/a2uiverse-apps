import {describe, it, expect} from 'vitest';
import {TextareaApi} from './textarea.schema';

describe('TextareaApi.schema', () => {
  it('accepts a minimal valid Textarea (value only)', () => {
    expect(TextareaApi.schema.safeParse({value: 'hi'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = TextareaApi.schema.safeParse({
      value: 'hi',
      placeholder: 'Leave a comment',
      disabled: true,
      required: true,
      validationStatus: 'error',
      block: true,
      resize: 'vertical',
      contrast: true,
      rows: 3,
      cols: 60,
      characterLimit: 40,
      minHeight: 200,
      maxHeight: 400,
      accessibility: {label: 'Comment', description: 'Your comment'},
    });
    expect(result.success).toBe(true);
  });

  it('requires value', () => {
    expect(TextareaApi.schema.safeParse({placeholder: 'hi'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TextareaApi.schema.safeParse({value: 'hi', name: 'comment'}).success).toBe(false);
  });

  it('rejects out-of-enum validationStatus values', () => {
    expect(TextareaApi.schema.safeParse({value: 'hi', validationStatus: 'warning'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum resize values', () => {
    expect(TextareaApi.schema.safeParse({value: 'hi', resize: 'diagonal'}).success).toBe(false);
  });

  it('accepts a data-binding for value (DynamicString)', () => {
    expect(TextareaApi.schema.safeParse({value: {path: '/draft'}}).success).toBe(true);
  });

  it('accepts a data-binding for placeholder (DynamicString)', () => {
    expect(TextareaApi.schema.safeParse({value: 'hi', placeholder: {path: '/hint'}}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(TextareaApi.schema.safeParse({value: 'hi', disabled: {path: '/locked'}}).success).toBe(
      true,
    );
  });
});
