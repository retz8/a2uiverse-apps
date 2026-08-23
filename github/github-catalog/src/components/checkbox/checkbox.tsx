import type {ChangeEvent} from 'react';
import {Checkbox as PrimerCheckbox} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {useFormControlInputProps} from '../../shared/form-control-forwarding';
import {CheckboxApi} from './checkbox.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* are resolved to primitives; the two-way write-back is onCheckedChange. */
type CheckboxViewProps = {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  validationStatus?: 'error' | 'success';
  value?: string;
  accessibility?: ResolvedAccessibility;
  /** The two-way write-back: the binder's auto-generated setChecked, called with the new state. */
  onCheckedChange?: (checked: boolean) => void;
};

export function CheckboxView({
  checked,
  indeterminate,
  disabled,
  required,
  validationStatus,
  value,
  accessibility,
  onCheckedChange,
}: CheckboxViewProps) {
  // Pick up id / disabled / required / aria-describedby from an enclosing FormControl (no-op when
  // standalone); disabled/required come from here, so they are not passed explicitly below.
  const formControlProps = useFormControlInputProps({disabled, required});
  return (
    <PrimerCheckbox
      {...formControlProps}
      checked={!!checked}
      indeterminate={indeterminate}
      validationStatus={validationStatus}
      value={value}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onCheckedChange?.(e.target.checked)}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders CheckboxView.
 * - `props.checked` is the resolved boolean; `props.setChecked` is the auto-generated two-way
 *   setter (GenerateSetters, from the DynamicBoolean prop) wired to the input's onChange so a
 *   user toggle writes the new value back to the bound data-model path. No Action, no buildChild.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const CheckboxComponent = createComponentImplementation(CheckboxApi, ({props}) => (
  <CheckboxView
    checked={props.checked}
    indeterminate={props.indeterminate}
    disabled={props.disabled}
    required={props.required}
    validationStatus={props.validationStatus}
    value={props.value}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
    onCheckedChange={props.setChecked}
  />
));
