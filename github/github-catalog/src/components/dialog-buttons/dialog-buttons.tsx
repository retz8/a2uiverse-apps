import {Dialog as PrimerDialog} from '@primer/react';
import type {DialogProps as PrimerDialogProps} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogButtonsApi} from './dialog-buttons.schema';

type PrimerFooterButtons = NonNullable<PrimerDialogProps['footerButtons']>;

/**
 * A `buttons` entry AFTER binder resolution: `content` is a plain string, `action` a ready-to-call
 * closure, `disabled`/`loading` booleans (the binder resolves the array's element fields in place).
 * The inferred prop type still shows the raw pre-resolution shapes, so `props.buttons` is cast to
 * this element-wise.
 */
type ResolvedDialogButton = {
  content: string;
  buttonType?: 'default' | 'primary' | 'danger' | 'normal';
  action?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

/** Maps a resolved `dialogButton` to Primer's `DialogButtonProps`: `action` → `onClick`. */
function toPrimerButton(button: ResolvedDialogButton): PrimerFooterButtons[number] {
  return {
    content: button.content,
    buttonType: button.buttonType,
    autoFocus: button.autoFocus,
    disabled: button.disabled,
    loading: button.loading,
    onClick: button.action,
  } as PrimerFooterButtons[number];
}

/** Resolved props: `buttons` are already in Primer's footer-button shape. */
type DialogButtonsViewProps = {buttons: PrimerFooterButtons};

export function DialogButtonsView({buttons}: DialogButtonsViewProps) {
  return <PrimerDialog.Buttons buttons={buttons} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogButtonsView.
 * - `props.buttons` is resolved element-wise by the binder (each `action` → a closure); mapped to
 *   Primer's `DialogButtonProps` (`Dialog.Buttons` maps `buttonType 'normal'` → `'default'` and
 *   focuses the first `autoFocus` entry).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogButtonsComponent = createComponentImplementation(DialogButtonsApi, ({props}) => (
  <DialogButtonsView
    buttons={(props.buttons as unknown as ResolvedDialogButton[]).map(toPrimerButton)}
  />
));
