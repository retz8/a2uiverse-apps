import {describe, it, expect} from 'vitest';
import {IconButtonApi} from './iconbutton.schema';

const action = {event: {name: 'approve'}};
const accessibility = {label: 'Like'};

describe('IconButtonApi.schema', () => {
  it('accepts a minimal valid IconButton (icon + action + accessibility)', () => {
    expect(IconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility}).success).toBe(
      true,
    );
  });

  it('accepts an event action', () => {
    expect(
      IconButtonApi.schema.safeParse({
        icon: 'glyph',
        action: {event: {name: 'approve'}},
        accessibility,
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall action', () => {
    expect(
      IconButtonApi.schema.safeParse({
        icon: 'glyph',
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
        accessibility,
      }).success,
    ).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = IconButtonApi.schema.safeParse({
      icon: 'glyph',
      action,
      accessibility: {label: 'Remove', description: 'Removes the item'},
      description: 'Remove this item',
      variant: 'danger',
      size: 'large',
      disabled: true,
      loading: false,
      inactive: false,
      loadingAnnouncement: 'Loading',
      block: true,
      keybindingHint: 'Mod+Backspace',
      tooltipDirection: 'se',
    });
    expect(result.success).toBe(true);
  });

  it('requires icon', () => {
    expect(IconButtonApi.schema.safeParse({action, accessibility}).success).toBe(false);
  });

  it('requires action', () => {
    expect(IconButtonApi.schema.safeParse({icon: 'glyph', accessibility}).success).toBe(false);
  });

  it('requires accessibility (an icon-only button must be labeled)', () => {
    expect(IconButtonApi.schema.safeParse({icon: 'glyph', action}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      IconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility, color: 'red'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum variant', () => {
    expect(
      IconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility, variant: 'ghost'})
        .success,
    ).toBe(false);
  });

  it('rejects out-of-enum size', () => {
    expect(
      IconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility, size: 'huge'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum tooltipDirection', () => {
    expect(
      IconButtonApi.schema.safeParse({icon: 'glyph', action, accessibility, tooltipDirection: 'up'})
        .success,
    ).toBe(false);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      IconButtonApi.schema.safeParse({
        icon: 'glyph',
        action,
        accessibility,
        disabled: {path: '/approved'},
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for description (DynamicString)', () => {
    expect(
      IconButtonApi.schema.safeParse({
        icon: 'glyph',
        action,
        accessibility,
        description: {path: '/tip'},
      }).success,
    ).toBe(true);
  });

  it('accepts keybindingHint as a single chord or a sequence of chords', () => {
    expect(
      IconButtonApi.schema.safeParse({
        icon: 'glyph',
        action,
        accessibility,
        keybindingHint: 'Mod+K',
      }).success,
    ).toBe(true);
    expect(
      IconButtonApi.schema.safeParse({
        icon: 'glyph',
        action,
        accessibility,
        keybindingHint: ['Mod+K', 'Mod+P'],
      }).success,
    ).toBe(true);
  });
});
