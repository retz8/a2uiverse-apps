import {describe, it, expect} from 'vitest';
import {TreeViewItemApi} from './treeview-item.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'select-item', context: {}}};

describe('TreeViewItemApi.schema', () => {
  it('accepts a minimal valid Item (children only)', () => {
    expect(TreeViewItemApi.schema.safeParse({children: ['label']}).success).toBe(true);
  });

  it('accepts a full-surface Item', () => {
    expect(
      TreeViewItemApi.schema.safeParse({
        children: ['label', 'subtree'],
        expanded: {path: '/openState'},
        current: true,
        action: eventAction,
        secondaryActions: [
          {label: 'Rename', icon: 'pencil', action: fnAction},
          {label: 'Delete', icon: 'trash', count: '3', action: eventAction},
        ],
        containIntrinsicSize: '0 40px',
      }).success,
    ).toBe(true);
  });

  it('accepts a data-bound expanded', () => {
    expect(
      TreeViewItemApi.schema.safeParse({children: ['label'], expanded: {path: '/open'}}).success,
    ).toBe(true);
  });

  it('accepts a data-bound current', () => {
    expect(
      TreeViewItemApi.schema.safeParse({children: ['label'], current: {path: '/sel'}}).success,
    ).toBe(true);
  });

  it('does not carry an id prop (id is the component-envelope id, stripped from props)', () => {
    // A stray `id` prop is rejected by .strict(), proving id is not part of the props surface.
    expect(TreeViewItemApi.schema.safeParse({children: ['label'], id: 'x'}).success).toBe(false);
  });

  it('rejects a missing required children', () => {
    expect(TreeViewItemApi.schema.safeParse({current: true}).success).toBe(false);
  });

  it('rejects a secondaryActions element missing its required icon', () => {
    expect(
      TreeViewItemApi.schema.safeParse({
        children: ['label'],
        secondaryActions: [{label: 'Rename', action: fnAction}],
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TreeViewItemApi.schema.safeParse({children: ['label'], color: 'red'}).success).toBe(
      false,
    );
  });
});
