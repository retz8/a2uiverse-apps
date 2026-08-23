import {describe, it, expect} from 'vitest';
import {TokenApi} from './token.schema';

describe('TokenApi.schema', () => {
  it('accepts a minimal valid Token (text only)', () => {
    expect(TokenApi.schema.safeParse({text: 'Token'}).success).toBe(true);
  });

  it('accepts a path-bound text (DynamicString)', () => {
    expect(TokenApi.schema.safeParse({text: {path: '/tokenText'}}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = TokenApi.schema.safeParse({
      text: 'With icon',
      leadingVisual: 'glyph',
      as: 'button',
      removeAction: {event: {name: 'token-remove'}},
      hideRemoveButton: true,
      isSelected: true,
      size: 'large',
      disabled: false,
      accessibility: {label: 'Remove', description: 'Removes the token'},
    });
    expect(result.success).toBe(true);
  });

  it('accepts an event removeAction', () => {
    expect(
      TokenApi.schema.safeParse({text: 't', removeAction: {event: {name: 'token-remove'}}}).success,
    ).toBe(true);
  });

  it('accepts a functionCall removeAction', () => {
    expect(
      TokenApi.schema.safeParse({
        text: 't',
        removeAction: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(TokenApi.schema.safeParse({isSelected: true}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TokenApi.schema.safeParse({text: 't', fillColor: '#000'}).success).toBe(false);
  });

  it('rejects an out-of-enum `as`', () => {
    expect(TokenApi.schema.safeParse({text: 't', as: 'div'}).success).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(TokenApi.schema.safeParse({text: 't', size: 'huge'}).success).toBe(false);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(TokenApi.schema.safeParse({text: 't', disabled: {path: '/removed'}}).success).toBe(true);
  });

  it('accepts a data-binding for isSelected and hideRemoveButton (DynamicBoolean)', () => {
    expect(
      TokenApi.schema.safeParse({
        text: 't',
        isSelected: {path: '/sel'},
        hideRemoveButton: {path: '/hide'},
      }).success,
    ).toBe(true);
  });

  it('accepts accessibility label and description', () => {
    expect(TokenApi.schema.safeParse({text: 't', accessibility: {label: 'Tag'}}).success).toBe(
      true,
    );
  });
});
