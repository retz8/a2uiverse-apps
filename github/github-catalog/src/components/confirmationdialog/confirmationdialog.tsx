import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {Button, IconButton} from '@primer/react';
import {XIcon} from '@primer/octicons-react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ConfirmationDialogApi} from './confirmationdialog.schema.js';
import {renderChildList} from '../../shared/child-list.js';

/** Primer's dialog widths, in pixels: the same presets, here the most the dialog takes. */
const WIDTHS = {small: 296, medium: 320, large: 480, xlarge: 640} as const;

/** Primer's dialog heights, in pixels: here the most the dialog takes before its body scrolls. */
const HEIGHTS = {small: 480, large: 640} as const;

type Width = string | number;

/**
 * Resolved props: Dynamic* resolve to primitives, the two synthetic Actions resolve to () => void
 * closures, and the ChildList arrives as built `children`. Primer's `ConfirmationDialog` takes a
 * single `onClose(gesture)`; the View splits it into `onConfirm`/`onCancel` — the confirm gesture
 * runs `onConfirm`, every other gesture (cancel / close-button / escape) runs `onCancel`.
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
  width?: Width;
  height?: 'small' | 'large' | 'auto';
  children?: ReactNode;
};

function maxWidthOf(width: Width): CSSProperties['maxWidth'] {
  if (typeof width === 'number') return width;
  return width in WIDTHS ? WIDTHS[width as keyof typeof WIDTHS] : width;
}

/**
 * Primer's `ConfirmationDialog` drawn in place: the same title, body, close button and two footer
 * buttons, in Primer's own spacing and type, inside the fragment's flow rather than over a backdrop.
 * An app's fragment shares the screen with other apps, so the dialog neither covers them nor traps
 * the keyboard: it takes focus on its own only while nothing else on the page holds it.
 */
export function ConfirmationDialogView({
  title,
  onConfirm,
  onCancel,
  cancelButtonContent = 'Cancel',
  confirmButtonContent = 'OK',
  confirmButtonType = 'normal',
  cancelButtonLoading = false,
  confirmButtonLoading = false,
  overrideButtonFocus,
  width = 'medium',
  height = 'auto',
  children,
}: ConfirmationDialogViewProps) {
  // Primer's ConfirmationDialog shows whenever it is mounted, so the leaf owns visibility. There is
  // no bound `open` path, so this is local-only: once dismissed it stays dismissed (until the
  // surface reloads).
  const [isOpen, setIsOpen] = useState(true);
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const buttonToFocus =
    overrideButtonFocus ?? (confirmButtonType === 'danger' ? 'cancel' : 'confirm');

  // Primer focuses this button as the dialog opens. In place, the dialog may arrive while the
  // person is typing elsewhere on the page, so it takes focus only from nobody, and only once.
  useEffect(() => {
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    (buttonToFocus === 'cancel' ? cancelRef : confirmRef).current?.focus({preventScroll: true});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, as the dialog appears
  }, []);

  if (!isOpen) return null;

  // The footer buttons fire their action and leave the dialog in place, so an agent writeback
  // (loading, a body swap) stays visible; the close button and Escape also dismiss it locally.
  const handleClose = (gesture: 'confirm' | 'close-button' | 'cancel' | 'escape') => {
    if (gesture === 'confirm') onConfirm?.();
    else onCancel?.();
    if (gesture === 'close-button' || gesture === 'escape') setIsOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    handleClose('escape');
  };

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={children ? bodyId : undefined}
      data-component="ConfirmationDialog"
      onKeyDown={onKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: maxWidthOf(width),
        maxHeight: height === 'auto' ? undefined : HEIGHTS[height],
        boxSizing: 'border-box',
        backgroundColor: 'var(--bgColor-default, #fff)',
        border: 'var(--borderWidth-default, 1px) solid var(--borderColor-default, #d1d9e0)',
        borderRadius: 'var(--borderRadius-large, .75rem)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexShrink: 0,
          padding: 'var(--base-size-8, .5rem)',
          boxShadow: '0 1px 0 var(--borderColor-default, #d1d9e0)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            paddingBlock: 'var(--base-size-6, .375rem)',
            paddingInline: 'var(--base-size-8, .5rem)',
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontSize: 'var(--text-body-size-medium, .875rem)',
              fontWeight: 'var(--text-title-weight-large, 600)' as CSSProperties['fontWeight'],
            }}
          >
            {title}
          </h2>
        </div>
        <IconButton
          icon={XIcon}
          aria-label="Close"
          variant="invisible"
          onClick={() => handleClose('close-button')}
        />
      </div>
      {children ? (
        <div
          id={bodyId}
          style={{flexGrow: 1, overflow: 'auto', padding: 'var(--base-size-16, 1rem)'}}
        >
          {children}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexFlow: 'wrap',
          flexShrink: 0,
          gap: 'var(--base-size-8, .5rem)',
          justifyContent: 'flex-end',
          padding: 'var(--base-size-16, 1rem)',
        }}
      >
        <Button ref={cancelRef} loading={cancelButtonLoading} onClick={() => handleClose('cancel')}>
          {cancelButtonContent}
        </Button>
        <Button
          ref={confirmRef}
          variant={confirmButtonType === 'normal' ? 'default' : confirmButtonType}
          loading={confirmButtonLoading}
          onClick={() => handleClose('confirm')}
        >
          {confirmButtonContent}
        </Button>
      </div>
    </div>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ConfirmationDialogView — Primer's
 * `ConfirmationDialog` drawn in place from Primer's own `Button` and `IconButton`.
 * - `props.confirmAction` / `props.cancelAction` resolve to () => void closures (event vs
 *   functionCall routing is the renderer's job) → the split gestures.
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
      width={props.width}
      height={props.height}
    >
      {renderChildList(props.children, buildChild)}
    </ConfirmationDialogView>
  ),
);
