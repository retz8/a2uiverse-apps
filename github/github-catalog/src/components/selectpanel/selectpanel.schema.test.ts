import {describe, it, expect} from 'vitest';
import {SelectPanelApi} from './selectpanel.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'panel-toggle', context: {}}};

const minimal = {anchor: 'trigger', open: true, children: ['i0']};

describe('SelectPanelApi.schema', () => {
  it('accepts a minimal valid SelectPanel (anchor + open + children)', () => {
    expect(SelectPanelApi.schema.safeParse(minimal).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      SelectPanelApi.schema.safeParse({
        anchor: 'trigger',
        children: {componentId: 'tpl', path: '/labels'},
        open: {path: '/open'},
        selectionVariant: 'multiple',
        title: 'Apply labels',
        subtitle: 'Select up to 10',
        filterValue: {path: '/filter'},
        placeholderText: 'Filter labels',
        inputLabel: 'Filter labels',
        variant: 'modal',
        onOpenChange: eventAction,
        onCancel: fnAction,
        secondaryAction: 'edit-labels',
        notice: {text: 'Managed by policy', variant: 'warning'},
        message: {title: 'No labels', body: 'Nothing here', variant: 'empty'},
        loading: false,
        showSelectedOptionsFirst: true,
        showSelectAll: true,
        align: 'center',
        height: 'medium',
        width: 'large',
        displayInViewport: true,
        showItemDividers: true,
        virtualized: false,
        focusOutBehavior: 'stop',
        disableFullscreenOnNarrow: true,
        accessibility: {label: 'Label picker'},
      }).success,
    ).toBe(true);
  });

  it('accepts a bound open path (two-way controlled visibility)', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, open: {path: '/open'}}).success).toBe(true);
  });

  it('accepts a bound filterValue (two-way local filtering)', () => {
    expect(
      SelectPanelApi.schema.safeParse({...minimal, filterValue: {path: '/filter'}}).success,
    ).toBe(true);
  });

  it('accepts both onOpenChange action shapes (functionCall and event)', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, onOpenChange: fnAction}).success).toBe(
      true,
    );
    expect(SelectPanelApi.schema.safeParse({...minimal, onOpenChange: eventAction}).success).toBe(
      true,
    );
  });

  it('rejects a missing required anchor', () => {
    expect(SelectPanelApi.schema.safeParse({open: true, children: ['i0']}).success).toBe(false);
  });

  it('rejects a missing required open', () => {
    expect(SelectPanelApi.schema.safeParse({anchor: 'trigger', children: ['i0']}).success).toBe(
      false,
    );
  });

  it('rejects missing required children', () => {
    expect(SelectPanelApi.schema.safeParse({anchor: 'trigger', open: true}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum selectionVariant', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, selectionVariant: 'many'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum variant', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, variant: 'popover'}).success).toBe(false);
  });

  it('rejects an out-of-enum align', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, align: 'middle'}).success).toBe(false);
  });

  it('rejects an out-of-enum height', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, height: 'huge'}).success).toBe(false);
  });

  it('rejects an out-of-enum width', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, width: 'tiny'}).success).toBe(false);
  });

  it('rejects an out-of-enum focusOutBehavior', () => {
    expect(SelectPanelApi.schema.safeParse({...minimal, focusOutBehavior: 'loop'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum notice variant', () => {
    expect(
      SelectPanelApi.schema.safeParse({...minimal, notice: {text: 'x', variant: 'success'}})
        .success,
    ).toBe(false);
  });

  it('rejects an out-of-enum message variant', () => {
    expect(
      SelectPanelApi.schema.safeParse({
        ...minimal,
        message: {title: 't', body: 'b', variant: 'info'},
      }).success,
    ).toBe(false);
  });
});
