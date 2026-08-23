import {describe, it, expect} from 'vitest';
import {IssueLabelTokenApi} from './issuelabeltoken.schema';

describe('IssueLabelTokenApi.schema', () => {
  it('accepts a minimal valid IssueLabelToken (text only)', () => {
    expect(IssueLabelTokenApi.schema.safeParse({text: 'bug'}).success).toBe(true);
  });

  it('accepts a path-bound text (DynamicString)', () => {
    expect(IssueLabelTokenApi.schema.safeParse({text: {path: '/labelText'}}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = IssueLabelTokenApi.schema.safeParse({
      text: 'bug',
      fillColor: '#d73a4a',
      as: 'button',
      removeAction: {event: {name: 'issue-label-remove'}},
      hideRemoveButton: true,
      isSelected: true,
      size: 'large',
      disabled: false,
      accessibility: {label: 'Remove', description: 'Removes the label'},
    });
    expect(result.success).toBe(true);
  });

  it('accepts an event removeAction', () => {
    expect(
      IssueLabelTokenApi.schema.safeParse({
        text: 't',
        removeAction: {event: {name: 'issue-label-remove'}},
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall removeAction', () => {
    expect(
      IssueLabelTokenApi.schema.safeParse({
        text: 't',
        removeAction: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for fillColor (DynamicString)', () => {
    expect(
      IssueLabelTokenApi.schema.safeParse({text: 't', fillColor: {path: '/color'}}).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(IssueLabelTokenApi.schema.safeParse({fillColor: '#000'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(IssueLabelTokenApi.schema.safeParse({text: 't', leadingVisual: 'x'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum `as`', () => {
    expect(IssueLabelTokenApi.schema.safeParse({text: 't', as: 'div'}).success).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(IssueLabelTokenApi.schema.safeParse({text: 't', size: 'huge'}).success).toBe(false);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      IssueLabelTokenApi.schema.safeParse({text: 't', disabled: {path: '/removed'}}).success,
    ).toBe(true);
  });

  it('accepts accessibility label and description', () => {
    expect(
      IssueLabelTokenApi.schema.safeParse({text: 't', accessibility: {label: 'Label'}}).success,
    ).toBe(true);
  });
});
