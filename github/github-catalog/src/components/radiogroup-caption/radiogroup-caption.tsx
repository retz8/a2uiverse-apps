import {RadioGroup as PrimerRadioGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {RadioGroupCaptionApi} from './radiogroup-caption.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it. */
type RadioGroupCaptionViewProps = {text: string};

export function RadioGroupCaptionView({text}: RadioGroupCaptionViewProps) {
  return <PrimerRadioGroup.Caption>{text}</PrimerRadioGroup.Caption>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders RadioGroupCaptionView.
 * - `props.text` (the resolved helper string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const RadioGroupCaptionComponent = createComponentImplementation(
  RadioGroupCaptionApi,
  ({props}) => <RadioGroupCaptionView text={props.text} />,
);
