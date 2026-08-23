import {FormControl as PrimerFormControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {FormControlLabelApi} from './formcontrol-label.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it; the
 * booleans/string pass through. `required`/`disabled` come from FormControl's context at render. */
type FormControlLabelViewProps = {
  text: string;
  visuallyHidden?: boolean;
  requiredIndicator?: boolean;
  requiredText?: string;
};

export function FormControlLabelView({
  text,
  visuallyHidden,
  requiredIndicator,
  requiredText,
}: FormControlLabelViewProps) {
  return (
    <PrimerFormControl.Label
      visuallyHidden={visuallyHidden}
      requiredIndicator={requiredIndicator}
      requiredText={requiredText}
    >
      {text}
    </PrimerFormControl.Label>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders FormControlLabelView.
 * - `props.text` (the resolved label string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const FormControlLabelComponent = createComponentImplementation(
  FormControlLabelApi,
  ({props}) => (
    <FormControlLabelView
      text={props.text}
      visuallyHidden={props.visuallyHidden}
      requiredIndicator={props.requiredIndicator}
      requiredText={props.requiredText}
    />
  ),
);
