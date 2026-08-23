import {FormControl as PrimerFormControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {FormControlCaptionApi} from './formcontrol-caption.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it. */
type FormControlCaptionViewProps = {text: string};

export function FormControlCaptionView({text}: FormControlCaptionViewProps) {
  return <PrimerFormControl.Caption>{text}</PrimerFormControl.Caption>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders FormControlCaptionView.
 * - `props.text` (the resolved helper string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const FormControlCaptionComponent = createComponentImplementation(
  FormControlCaptionApi,
  ({props}) => <FormControlCaptionView text={props.text} />,
);
