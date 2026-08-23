import {RadioGroup as PrimerRadioGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {RadioGroupLabelApi} from './radiogroup-label.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it; the
 * boolean passes through. */
type RadioGroupLabelViewProps = {
  text: string;
  visuallyHidden?: boolean;
};

export function RadioGroupLabelView({text, visuallyHidden}: RadioGroupLabelViewProps) {
  return <PrimerRadioGroup.Label visuallyHidden={visuallyHidden}>{text}</PrimerRadioGroup.Label>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders RadioGroupLabelView.
 * - `props.text` (the resolved label string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const RadioGroupLabelComponent = createComponentImplementation(
  RadioGroupLabelApi,
  ({props}) => <RadioGroupLabelView text={props.text} visuallyHidden={props.visuallyHidden} />,
);
