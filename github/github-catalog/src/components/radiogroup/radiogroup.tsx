import {type ReactNode} from 'react';
import {RadioGroup as PrimerRadioGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {RadioGroupApi} from './radiogroup.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

/**
 * Slot routing for the root's `children`. Primer's `RadioGroup` scans direct children for its
 * `Label`/`Caption`/`Validation` slots by `__SLOT__` marker (`useSlots`), but the binder renders
 * every child through an opaque `DeferredChild` wrapper that buries the marker — so each slot leaf is
 * wrapped in a marker-carrying `bridge` (the `Dialog`/`FormControl` slot-scan precedent). The
 * `FormControl`-wrapped radio options are not in this map, so they fall through to become the group's
 * inputs. `forward` copies the element-level props Primer reads off the matched slot element:
 * `Label.visuallyHidden` (drives the hidden legend) and `Validation.variant` (drives the validation
 * status).
 */
const RADIO_GROUP_SLOTS: SlotMap = {
  RadioGroupLabel: {mode: 'bridge', slot: PrimerRadioGroup.Label, forward: ['visuallyHidden']},
  RadioGroupCaption: {mode: 'bridge', slot: PrimerRadioGroup.Caption},
  RadioGroupValidation: {
    mode: 'bridge',
    slot: PrimerRadioGroup.Validation,
    forward: ['variant'],
  },
};

/** Resolved props: Dynamic* resolve to primitives, the `action` resolves to a () => void closure
 * (wired as Primer's group `onChange`), and the slot-routed ChildList arrives as built `children`. */
type RadioGroupViewProps = {
  name: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabelledby?: string;
  onChange?: () => void;
  children?: ReactNode;
};

export function RadioGroupView({
  name,
  disabled,
  required,
  ariaLabelledby,
  onChange,
  children,
}: RadioGroupViewProps) {
  return (
    <PrimerRadioGroup
      name={name}
      onChange={onChange}
      disabled={disabled}
      required={required}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </PrimerRadioGroup>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders RadioGroupView.
 * - `props.children` is a resolved `ChildList`; `renderSlottedChildList` routes the three
 *   subcomponent leaves into Primer's slots (see `RADIO_GROUP_SLOTS`) and lets the
 *   `FormControl`-wrapped radio options fall through as the group's inputs; the `context` gives each
 *   child's type via the surface model.
 * - `props.action` is resolved to a () => void closure (the renderer routes event vs functionCall)
 *   -> passed as the group's `onChange` (fires on any selection via `RadioGroupContext`).
 * - `props.name`/`disabled`/`required`/`aria-labelledby` pass straight through.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const RadioGroupComponent = createComponentImplementation(
  RadioGroupApi,
  ({props, buildChild, context}) => (
    <RadioGroupView
      name={props.name}
      disabled={props.disabled}
      required={props.required}
      ariaLabelledby={props['aria-labelledby']}
      onChange={props.action}
    >
      {renderSlottedChildList(props.children, buildChild, context, RADIO_GROUP_SLOTS)}
    </RadioGroupView>
  ),
);
