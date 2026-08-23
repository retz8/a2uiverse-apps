import type {ReactNode} from 'react';
import {FormControl as PrimerFormControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {FormControlLeadingVisualApi} from './formcontrol-leadingvisual.schema';

/** Resolved props: the `child` ComponentId arrives as a built node (the leading icon). */
type FormControlLeadingVisualViewProps = {children?: ReactNode};

export function FormControlLeadingVisualView({children}: FormControlLeadingVisualViewProps) {
  return <PrimerFormControl.LeadingVisual>{children}</PrimerFormControl.LeadingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders FormControlLeadingVisualView.
 * - `props.child` (required ComponentId) is built via `buildChild` — the leading icon.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const FormControlLeadingVisualComponent = createComponentImplementation(
  FormControlLeadingVisualApi,
  ({props, buildChild}) => (
    <FormControlLeadingVisualView>{buildChild(props.child)}</FormControlLeadingVisualView>
  ),
);
