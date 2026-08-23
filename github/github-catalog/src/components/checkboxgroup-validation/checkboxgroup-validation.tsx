import {CheckboxGroup as PrimerCheckboxGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {CheckboxGroupValidationApi} from './checkboxgroup-validation.schema';

/** Resolved props: the DynamicString `text` is a plain string, and the bindable `variant` union
 * resolves to a literal `'error'`/`'success'` after the binder resolves any `DataBinding`. */
type CheckboxGroupValidationViewProps = {
  text: string;
  variant: 'error' | 'success';
};

export function CheckboxGroupValidationView({text, variant}: CheckboxGroupValidationViewProps) {
  return <PrimerCheckboxGroup.Validation variant={variant}>{text}</PrimerCheckboxGroup.Validation>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders CheckboxGroupValidationView.
 * - `props.text` (the resolved message string) passes straight through — no `buildChild`/`onClick`.
 * - `props.variant` resolves to a literal `'error'`/`'success'` (a bound `DataBinding` arm is
 *   resolved through the data model to one of those literals).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const CheckboxGroupValidationComponent = createComponentImplementation(
  CheckboxGroupValidationApi,
  ({props}) => <CheckboxGroupValidationView text={props.text} variant={props.variant} />,
);
