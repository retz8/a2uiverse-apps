import {describe, it, expect} from 'vitest';
import {ActionListApi} from './actionlist.schema';

describe('ActionListApi.schema', () => {
  it('accepts a minimal valid ActionList (every prop optional)', () => {
    expect(ActionListApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListApi.schema.safeParse({
        children: ['item-1', 'item-2'],
        variant: 'full',
        selectionVariant: 'multiple',
        showDividers: true,
        role: 'listbox',
        disableFocusZone: true,
        as: 'ol',
        accessibility: {label: 'Repository actions', description: 'Choose an action'},
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(ActionListApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      ActionListApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('accepts the radio selectionVariant (code is authority; doc table omits it)', () => {
    expect(ActionListApi.schema.safeParse({selectionVariant: 'radio'}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(ActionListApi.schema.safeParse({variant: 'compact'}).success).toBe(false);
  });

  it('rejects an out-of-enum selectionVariant', () => {
    expect(ActionListApi.schema.safeParse({selectionVariant: 'toggle'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(ActionListApi.schema.safeParse({as: 'table'}).success).toBe(false);
  });
});
