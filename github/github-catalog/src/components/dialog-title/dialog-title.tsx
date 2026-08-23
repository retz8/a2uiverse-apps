import {Dialog as PrimerDialog} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogTitleApi} from './dialog-title.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it. */
type DialogTitleViewProps = {text: string};

export function DialogTitleView({text}: DialogTitleViewProps) {
  return <PrimerDialog.Title>{text}</PrimerDialog.Title>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogTitleView.
 * - `props.text` (the resolved heading string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogTitleComponent = createComponentImplementation(DialogTitleApi, ({props}) => (
  <DialogTitleView text={props.text} />
));
