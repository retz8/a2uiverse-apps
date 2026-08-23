import {describe, it, expect} from 'vitest';
import {ActionBarMenuApi} from './actionbar-menu.schema';

const accessibility = {label: 'Actions'};
const action = {functionCall: {call: 'consoleLog', args: {message: 'x'}, returnType: 'void'}};

describe('ActionBarMenuApi.schema', () => {
  it('accepts a minimal valid ActionBar.Menu (icon + accessibility + items)', () => {
    expect(
      ActionBarMenuApi.schema.safeParse({icon: 'glyph', accessibility, items: []}).success,
    ).toBe(true);
  });

  it('accepts a full-surface ActionBar.Menu with a breadth of item shapes', () => {
    expect(
      ActionBarMenuApi.schema.safeParse({
        icon: 'glyph',
        accessibility,
        overflowIcon: 'glyph',
        items: [
          {label: 'Cut', leadingVisual: 'cut-icon', action},
          {label: 'Copy', trailingVisual: '⌘C', action: {event: {name: 'copy', context: {}}}},
          {label: 'Paste', trailingVisual: 'paste-icon'},
          {type: 'divider'},
          {label: 'Delete', variant: 'danger', action},
          {label: 'Archive', disabled: true},
          {
            label: 'More',
            leadingVisual: 'more-icon',
            items: [{label: 'Sub A', action}, {label: 'Sub B'}],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('accepts overflowIcon: "none"', () => {
    expect(
      ActionBarMenuApi.schema.safeParse({
        icon: 'glyph',
        accessibility,
        items: [],
        overflowIcon: 'none',
      }).success,
    ).toBe(true);
  });

  it('requires icon', () => {
    expect(ActionBarMenuApi.schema.safeParse({accessibility, items: []}).success).toBe(false);
  });

  it('requires accessibility', () => {
    expect(ActionBarMenuApi.schema.safeParse({icon: 'glyph', items: []}).success).toBe(false);
  });

  it('requires items', () => {
    expect(ActionBarMenuApi.schema.safeParse({icon: 'glyph', accessibility}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ActionBarMenuApi.schema.safeParse({icon: 'glyph', accessibility, items: [], variant: 'x'})
        .success,
    ).toBe(false);
  });

  it('rejects an out-of-enum item variant', () => {
    expect(
      ActionBarMenuApi.schema.safeParse({
        icon: 'glyph',
        accessibility,
        items: [{label: 'X', variant: 'primary'}],
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown field on a menu item (strict)', () => {
    expect(
      ActionBarMenuApi.schema.safeParse({
        icon: 'glyph',
        accessibility,
        items: [{label: 'X', color: 'red'}],
      }).success,
    ).toBe(false);
  });
});
