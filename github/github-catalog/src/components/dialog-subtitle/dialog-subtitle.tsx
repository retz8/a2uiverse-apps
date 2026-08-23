import {Dialog as PrimerDialog} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogSubtitleApi} from './dialog-subtitle.schema';

/** Resolved props: the DynamicString `text` is a plain string after the binder resolves it. */
type DialogSubtitleViewProps = {text: string};

export function DialogSubtitleView({text}: DialogSubtitleViewProps) {
  return <PrimerDialog.Subtitle>{text}</PrimerDialog.Subtitle>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogSubtitleView.
 * - `props.text` (the resolved subtitle string) passes straight through — no `buildChild`/`onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogSubtitleComponent = createComponentImplementation(
  DialogSubtitleApi,
  ({props}) => <DialogSubtitleView text={props.text} />,
);
