import {CheckboxGroup as PrimerCheckboxGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {CheckboxGroupLabelApi} from './checkboxgroup-label.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it; the
 * boolean passes through. */
type CheckboxGroupLabelViewProps = {
  text: string;
  visuallyHidden?: boolean;
};

export function CheckboxGroupLabelView({text, visuallyHidden}: CheckboxGroupLabelViewProps) {
  return (
    <PrimerCheckboxGroup.Label visuallyHidden={visuallyHidden}>{text}</PrimerCheckboxGroup.Label>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders CheckboxGroupLabelView.
 * - `props.text` (the resolved label string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const CheckboxGroupLabelComponent = createComponentImplementation(
  CheckboxGroupLabelApi,
  ({props}) => <CheckboxGroupLabelView text={props.text} visuallyHidden={props.visuallyHidden} />,
);
