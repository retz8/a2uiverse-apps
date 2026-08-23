import {CheckboxGroup as PrimerCheckboxGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {CheckboxGroupCaptionApi} from './checkboxgroup-caption.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it. */
type CheckboxGroupCaptionViewProps = {text: string};

export function CheckboxGroupCaptionView({text}: CheckboxGroupCaptionViewProps) {
  return <PrimerCheckboxGroup.Caption>{text}</PrimerCheckboxGroup.Caption>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders CheckboxGroupCaptionView.
 * - `props.text` (the resolved helper string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const CheckboxGroupCaptionComponent = createComponentImplementation(
  CheckboxGroupCaptionApi,
  ({props}) => <CheckboxGroupCaptionView text={props.text} />,
);
