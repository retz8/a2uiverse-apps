import {describe, it, expect} from 'vitest';
import {SelectPanelItemApi} from './selectpanel-item.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'label-select', context: {}}};

describe('SelectPanelItemApi.schema', () => {
  it('accepts a minimal valid item (text only)', () => {
    expect(SelectPanelItemApi.schema.safeParse({text: 'bug'}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      SelectPanelItemApi.schema.safeParse({
        text: 'bug',
        description: "Something isn't working",
        descriptionVariant: 'block',
        leadingVisual: 'bug-icon',
        trailingVisual: 'bug-count',
        variant: 'danger',
        selected: {path: '/sel/bug'},
        disabled: false,
        action: eventAction,
      }).success,
    ).toBe(true);
  });

  it('accepts a bound selected path (two-way selection)', () => {
    expect(
      SelectPanelItemApi.schema.safeParse({text: 'bug', selected: {path: '/sel/bug'}}).success,
    ).toBe(true);
  });

  it('accepts both action shapes (functionCall and event)', () => {
    expect(SelectPanelItemApi.schema.safeParse({text: 'bug', action: fnAction}).success).toBe(true);
    expect(SelectPanelItemApi.schema.safeParse({text: 'bug', action: eventAction}).success).toBe(
      true,
    );
  });

  it('rejects a missing required text', () => {
    expect(SelectPanelItemApi.schema.safeParse({description: 'x'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SelectPanelItemApi.schema.safeParse({text: 'bug', color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum descriptionVariant', () => {
    expect(
      SelectPanelItemApi.schema.safeParse({text: 'bug', descriptionVariant: 'beside'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(SelectPanelItemApi.schema.safeParse({text: 'bug', variant: 'primary'}).success).toBe(
      false,
    );
  });
});
