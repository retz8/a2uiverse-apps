import {Radio as PrimerRadio} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {useFormControlInputProps} from '../../shared/form-control-forwarding';
import {RadioApi} from './radio.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* are resolved to primitives, action -> onChange. */
type RadioViewProps = {
  value: string;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  accessibility?: ResolvedAccessibility;
  onChange?: () => void;
};

export function RadioView({
  value,
  name,
  checked,
  disabled,
  required,
  accessibility,
  onChange,
}: RadioViewProps) {
  // Pick up id / disabled / required / aria-describedby from an enclosing FormControl (no-op when
  // standalone); disabled/required come from here, so they are not passed explicitly below.
  const formControlProps = useFormControlInputProps({disabled, required});
  return (
    <PrimerRadio
      {...formControlProps}
      value={value}
      name={name}
      checked={checked}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
      onChange={onChange}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders RadioView.
 * - `props.action` is resolved to a () => void closure (the renderer routes event vs
 *   functionCall) -> passed as onChange (Primer Radio's interaction slot).
 * - `props.checked`/`props.disabled` carry resolved booleans at runtime.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Radio has no ComponentId slot, so there is no buildChild. Props are passed explicitly
 * (no spread): resolved props include extra binder setters.
 */
export const RadioComponent = createComponentImplementation(RadioApi, ({props}) => (
  <RadioView
    value={props.value}
    name={props.name}
    checked={props.checked}
    disabled={props.disabled}
    required={props.required}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
    onChange={props.action}
  />
));
