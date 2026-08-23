import {type ReactNode} from 'react';
import {FormControl as PrimerFormControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {FormControlApi} from './formcontrol.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

/**
 * Slot routing for the root's `children`. Primer's `FormControl` scans direct children for its
 * `Label`/`Caption`/`Validation`/`LeadingVisual` slots by `__SLOT__` marker (`useSlots`), but the
 * binder renders every child through an opaque `DeferredChild` wrapper that buries the marker — so
 * each slot leaf is wrapped in a marker-carrying `bridge` (the `Dialog` slot-scan precedent). The
 * wrapped input (`TextInput` / `Checkbox`) is not in this map, so it falls through to become the
 * form control's input. `forward` copies the element-level props Primer reads off the matched slot
 * element: `Label.visuallyHidden` (drives `isLabelHidden`) and `Validation.variant` (drives the
 * validation status).
 */
const FORM_CONTROL_SLOTS: SlotMap = {
  FormControlLabel: {mode: 'bridge', slot: PrimerFormControl.Label, forward: ['visuallyHidden']},
  FormControlCaption: {mode: 'bridge', slot: PrimerFormControl.Caption},
  FormControlValidation: {
    mode: 'bridge',
    slot: PrimerFormControl.Validation,
    forward: ['variant'],
  },
  FormControlLeadingVisual: {mode: 'bridge', slot: PrimerFormControl.LeadingVisual},
};

/** Resolved props: Dynamic* resolve to primitives, and the slot-routed ChildList arrives as built
 * `children`. */
type FormControlViewProps = {
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical';
  required?: boolean;
  children?: ReactNode;
};

export function FormControlView({disabled, layout, required, children}: FormControlViewProps) {
  return (
    <PrimerFormControl disabled={disabled} layout={layout} required={required}>
      {children}
    </PrimerFormControl>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders FormControlView.
 * - `props.children` is a resolved `ChildList`; `renderSlottedChildList` routes the four
 *   subcomponent leaves into Primer's slots (see `FORM_CONTROL_SLOTS`) and lets the wrapped input
 *   fall through as the input control; the `context` gives each child's type via the surface model.
 * - `disabled`/`required`/`layout` pass straight through.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const FormControlComponent = createComponentImplementation(
  FormControlApi,
  ({props, buildChild, context}) => (
    <FormControlView disabled={props.disabled} layout={props.layout} required={props.required}>
      {renderSlottedChildList(props.children, buildChild, context, FORM_CONTROL_SLOTS)}
    </FormControlView>
  ),
);
