import {Dialog as PrimerDialog} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogCloseButtonApi} from './dialog-closebutton.schema';

/** Resolved props: the Action resolves to a () => void closure wired to Primer's onClose. */
type DialogCloseButtonViewProps = {onClose?: () => void};

export function DialogCloseButtonView({onClose}: DialogCloseButtonViewProps) {
  return <PrimerDialog.CloseButton onClose={onClose ?? (() => {})} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogCloseButtonView.
 * - `props.closeAction` resolves to a () => void closure → onClose (the renderer routes event vs
 *   functionCall).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogCloseButtonComponent = createComponentImplementation(
  DialogCloseButtonApi,
  ({props}) => <DialogCloseButtonView onClose={props.closeAction} />,
);
