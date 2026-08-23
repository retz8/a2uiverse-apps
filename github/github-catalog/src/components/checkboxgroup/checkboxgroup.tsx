import {type ReactNode} from 'react';
import {CheckboxGroup as PrimerCheckboxGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {CheckboxGroupApi} from './checkboxgroup.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

/**
 * Slot routing for the root's `children`. Primer's `CheckboxGroup` scans direct children for its
 * `Label`/`Caption`/`Validation` slots by `__SLOT__` marker (`useSlots`), but the binder renders
 * every child through an opaque `DeferredChild` wrapper that buries the marker — so each slot leaf is
 * wrapped in a marker-carrying `bridge` (the `Dialog`/`FormControl` slot-scan precedent). The
 * `FormControl`-wrapped checkbox options are not in this map, so they fall through to become the
 * group's inputs. `forward` copies the element-level props Primer reads off the matched slot element:
 * `Label.visuallyHidden` (drives the hidden legend) and `Validation.variant` (drives the validation
 * status).
 */
const CHECKBOX_GROUP_SLOTS: SlotMap = {
  CheckboxGroupLabel: {
    mode: 'bridge',
    slot: PrimerCheckboxGroup.Label,
    forward: ['visuallyHidden'],
  },
  CheckboxGroupCaption: {mode: 'bridge', slot: PrimerCheckboxGroup.Caption},
  CheckboxGroupValidation: {
    mode: 'bridge',
    slot: PrimerCheckboxGroup.Validation,
    forward: ['variant'],
  },
};

/** Resolved props: Dynamic* resolve to primitives, and the slot-routed ChildList arrives as built
 * `children`. */
type CheckboxGroupViewProps = {
  disabled?: boolean;
  required?: boolean;
  children?: ReactNode;
};

export function CheckboxGroupView({disabled, required, children}: CheckboxGroupViewProps) {
  return (
    <PrimerCheckboxGroup disabled={disabled} required={required}>
      {children}
    </PrimerCheckboxGroup>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders CheckboxGroupView.
 * - `props.children` is a resolved `ChildList`; `renderSlottedChildList` routes the three
 *   subcomponent leaves into Primer's slots (see `CHECKBOX_GROUP_SLOTS`) and lets the
 *   `FormControl`-wrapped checkbox options fall through as the group's inputs; the `context` gives
 *   each child's type via the surface model.
 * - `disabled`/`required` pass straight through.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const CheckboxGroupComponent = createComponentImplementation(
  CheckboxGroupApi,
  ({props, buildChild, context}) => (
    <CheckboxGroupView disabled={props.disabled} required={props.required}>
      {renderSlottedChildList(props.children, buildChild, context, CHECKBOX_GROUP_SLOTS)}
    </CheckboxGroupView>
  ),
);
