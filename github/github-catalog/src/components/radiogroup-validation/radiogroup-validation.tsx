import {RadioGroup as PrimerRadioGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {RadioGroupValidationApi} from './radiogroup-validation.schema';

/** Resolved props: the DynamicString `text` is a plain string, and the bindable `variant` union
 * resolves to a literal `'error'`/`'success'` after the binder resolves any `DataBinding`. */
type RadioGroupValidationViewProps = {
  text: string;
  variant: 'error' | 'success';
};

export function RadioGroupValidationView({text, variant}: RadioGroupValidationViewProps) {
  return <PrimerRadioGroup.Validation variant={variant}>{text}</PrimerRadioGroup.Validation>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders RadioGroupValidationView.
 * - `props.text` (the resolved message string) passes straight through — no `buildChild`/`onClick`.
 * - `props.variant` resolves to a literal `'error'`/`'success'` (a bound `DataBinding` arm is
 *   resolved through the data model to one of those literals).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const RadioGroupValidationComponent = createComponentImplementation(
  RadioGroupValidationApi,
  ({props}) => <RadioGroupValidationView text={props.text} variant={props.variant} />,
);
