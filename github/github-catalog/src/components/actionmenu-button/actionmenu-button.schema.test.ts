import {describe, it, expect} from 'vitest';
import {ActionMenuButtonApi} from './actionmenu-button.schema';

describe('ActionMenuButtonApi.schema', () => {
  it('accepts a minimal valid ActionMenu.Button (no required props)', () => {
    expect(ActionMenuButtonApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      ActionMenuButtonApi.schema.safeParse({
        child: 'label',
        variant: 'primary',
        size: 'medium',
        alignContent: 'center',
        disabled: {path: '/disabled'},
        loading: false,
        inactive: {path: '/inactive'},
        count: '3',
        block: true,
        labelWrap: true,
        loadingAnnouncement: 'Loading',
        icon: 'kebab',
        leadingVisual: 'lead',
        trailingVisual: 'caret',
        trailingAction: 'ta',
        accessibility: {label: 'Actions'},
      }).success,
    ).toBe(true);
  });

  it('accepts data-binding on the Dynamic props', () => {
    expect(
      ActionMenuButtonApi.schema.safeParse({
        disabled: {path: '/d'},
        loading: {path: '/l'},
        inactive: {path: '/i'},
        count: {path: '/c'},
      }).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum variant', () => {
    expect(ActionMenuButtonApi.schema.safeParse({variant: 'ghost'}).success).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(ActionMenuButtonApi.schema.safeParse({size: 'xl'}).success).toBe(false);
  });

  it('rejects the dropped action prop (owned by the parent menu; strict)', () => {
    expect(
      ActionMenuButtonApi.schema.safeParse({
        action: {functionCall: {call: 'consoleLog', args: {}, returnType: 'void'}},
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionMenuButtonApi.schema.safeParse({href: '/x'}).success).toBe(false);
  });
});
