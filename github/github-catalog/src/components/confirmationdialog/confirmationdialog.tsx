import {type ReactNode, useState} from 'react';
import {ConfirmationDialog as PrimerConfirmationDialog} from '@primer/react';
import type {ConfirmationDialogProps as PrimerConfirmationDialogProps} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ConfirmationDialogApi} from './confirmationdialog.schema';
import {renderChildList} from '../../shared/child-list';

/**
 * Resolved props: Dynamic* resolve to primitives, the two synthetic Actions resolve to () => void
 * closures, and the ChildList arrives as built `children`. Primer's `ConfirmationDialog` requires a
 * single `onClose(gesture)`; the View reassembles it from `onConfirm`/`onCancel` — the confirm
 * gesture runs `onConfirm`, every other gesture (cancel / close-button / escape) runs `onCancel`.
 */
type ConfirmationDialogViewProps = {
  title: string;
  /** The confirm gesture (resolved `confirmAction`). */
  onConfirm?: () => void;
  /** The cancel / close-button / escape gestures (resolved `cancelAction`). */
  onCancel?: () => void;
  cancelButtonContent?: string;
  confirmButtonContent?: string;
  confirmButtonType?: 'normal' | 'primary' | 'danger';
  cancelButtonLoading?: boolean;
  confirmButtonLoading?: boolean;
  overrideButtonFocus?: 'cancel' | 'confirm';
  width?: PrimerConfirmationDialogProps['width'];
  height?: 'small' | 'large' | 'auto';
  children?: ReactNode;
};

export function ConfirmationDialogView({
  title,
  onConfirm,
  onCancel,
  cancelButtonContent,
  confirmButtonContent,
  confirmButtonType,
  cancelButtonLoading,
  confirmButtonLoading,
  overrideButtonFocus,
  width,
  height,
  children,
}: ConfirmationDialogViewProps) {
  // Primer's ConfirmationDialog has no self-managed open state — it shows whenever it is mounted —
  // so the leaf owns visibility (the `{isOpen && <Dialog>}` pattern, mirroring the Dialog family).
  // Unlike Dialog there is no bound `open` path, so this is local-only: once dismissed it stays
  // dismissed (until the surface reloads).
  const [isOpen, setIsOpen] = useState(true);
  if (!isOpen) return null;

  // The single required onClose(gesture) is split back out: 'confirm' → onConfirm, everything else
  // ('cancel' from the cancel button, 'close-button' from the header X, 'escape' from the Escape key
  // and the backdrop) → onCancel. Mirrors the component's own true/false collapse. The two footer
  // buttons ('confirm'/'cancel') fire their action and leave the dialog open (like Dialog's footer
  // buttons); the pure dismissal gestures ('close-button'/'escape'/backdrop) also close it locally.
  const handleClose = (gesture: 'confirm' | 'close-button' | 'cancel' | 'escape') => {
    if (gesture === 'confirm') onConfirm?.();
    else onCancel?.();
    if (gesture === 'close-button' || gesture === 'escape') setIsOpen(false);
  };

  return (
    <PrimerConfirmationDialog
      title={title}
      onClose={handleClose}
      cancelButtonContent={cancelButtonContent}
      confirmButtonContent={confirmButtonContent}
      confirmButtonType={confirmButtonType}
      cancelButtonLoading={cancelButtonLoading}
      confirmButtonLoading={confirmButtonLoading}
      overrideButtonFocus={overrideButtonFocus}
      width={width}
      height={height}
    >
      {children}
    </PrimerConfirmationDialog>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ConfirmationDialogView. It wraps
 * Primer's self-contained `ConfirmationDialog`, which renders through `Dialog` — it portals to the
 * body and manages its own backdrop/focus/Escape/scroll-lock.
 * - `props.confirmAction` / `props.cancelAction` resolve to () => void closures (event vs
 *   functionCall routing is the renderer's job) → the reassembled `onClose(gesture)`.
 * - `props.children` (optional ChildList) is built via `renderChildList` — the dialog body message.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ConfirmationDialogComponent = createComponentImplementation(
  ConfirmationDialogApi,
  ({props, buildChild}) => (
    <ConfirmationDialogView
      title={props.title}
      onConfirm={props.confirmAction}
      onCancel={props.cancelAction}
      cancelButtonContent={props.cancelButtonContent}
      confirmButtonContent={props.confirmButtonContent}
      confirmButtonType={props.confirmButtonType}
      cancelButtonLoading={props.cancelButtonLoading}
      confirmButtonLoading={props.confirmButtonLoading}
      overrideButtonFocus={props.overrideButtonFocus}
      width={props.width as PrimerConfirmationDialogProps['width']}
      height={props.height}
    >
      {renderChildList(props.children, buildChild)}
    </ConfirmationDialogView>
  ),
);
