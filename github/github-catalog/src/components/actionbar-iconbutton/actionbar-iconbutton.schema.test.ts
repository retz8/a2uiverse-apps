import {describe, it, expect} from 'vitest';
import {ActionBarIconButtonApi} from './actionbar-iconbutton.schema';

const action = {event: {name: 'save'}};
const accessibility = {label: 'Save'};

describe('ActionBarIconButtonApi.schema', () => {
  it('accepts a minimal valid ActionBar.IconButton (icon + action + accessibility)', () => {
    expect(
      ActionBarIconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility}).success,
    ).toBe(true);
  });

  it('accepts a full-surface ActionBar.IconButton', () => {
    expect(
      ActionBarIconButtonApi.schema.safeParse({
        icon: 'glyph',
        action,
        accessibility,
        disabled: true,
      }).success,
    ).toBe(true);
  });

  it('requires icon', () => {
    expect(ActionBarIconButtonApi.schema.safeParse({action, accessibility}).success).toBe(false);
  });

  it('requires action', () => {
    expect(ActionBarIconButtonApi.schema.safeParse({icon: 'glyph', accessibility}).success).toBe(
      false,
    );
  });

  it('requires accessibility', () => {
    expect(ActionBarIconButtonApi.schema.safeParse({icon: 'glyph', action}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ActionBarIconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility, variant: 'x'})
        .success,
    ).toBe(false);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      ActionBarIconButtonApi.schema.safeParse({
        icon: 'glyph',
        action,
        accessibility,
        disabled: {path: '/saved'},
      }).success,
    ).toBe(true);
  });
});
