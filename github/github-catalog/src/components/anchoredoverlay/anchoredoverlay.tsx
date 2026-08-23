import {type ReactNode, useEffect, useState} from 'react';
import {AnchoredOverlay as PrimerAnchoredOverlay} from '@primer/react';
import type {AnchoredOverlayProps as PrimerAnchoredOverlayProps} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AnchoredOverlayApi} from './anchoredoverlay.schema.js';
import {renderChildList} from '../../shared/child-list.js';

type AnchorSide = NonNullable<PrimerAnchoredOverlayProps['side']>;
type AnchorAlign = NonNullable<PrimerAnchoredOverlayProps['align']>;
type OverlayHeight = PrimerAnchoredOverlayProps['height'];
type OverlayWidth = PrimerAnchoredOverlayProps['width'];

/** The flat authored variant enum (over the narrow arm). */
export type AnchoredOverlayVariant = 'anchored' | 'fullscreen';

/**
 * Projects the flat `variant` enum back onto Primer's `ResponsiveValue<'anchored', ...>`: the
 * `regular` arm is fixed to `'anchored'`, the authored value drives the only variable arm (`narrow`)
 * — so `'fullscreen'` → `{regular: 'anchored', narrow: 'fullscreen'}`. Undefined passes through so
 * Primer applies its own default.
 */
export function mapVariant(
  variant?: AnchoredOverlayVariant,
): PrimerAnchoredOverlayProps['variant'] {
  return variant === undefined ? undefined : {regular: 'anchored', narrow: variant};
}

/** Resolved props: Dynamic* resolve to primitives, `anchor`/`children` arrive as built nodes, and
 * the two-way write-back is the binder's auto-generated `setOpen`. */
type AnchoredOverlayViewProps = {
  /** The built trigger (resolved `anchor` ComponentId), wrapped and handed to Primer's renderAnchor. */
  anchor: ReactNode;
  /** Controlled visibility (resolved `open`). */
  open?: boolean;
  /** The binder's auto-generated two-way setter for the bound `open`; called with the new state. */
  setOpen?: (open: boolean) => void;
  /** The custom open hook (resolved `onOpen`), fired on an open gesture alongside the automatic flip. */
  onOpen?: () => void;
  /** The custom close hook (resolved `onClose`), fired on a close gesture alongside the automatic flip. */
  onClose?: () => void;
  children?: ReactNode;
  side?: AnchorSide;
  align?: AnchorAlign;
  anchorOffset?: number;
  alignmentOffset?: number;
  displayInViewport?: boolean;
  height?: OverlayHeight;
  width?: OverlayWidth;
  preventOverflow?: boolean;
  pinPosition?: boolean;
  variant?: AnchoredOverlayVariant;
  displayCloseButton?: boolean;
};

export function AnchoredOverlayView({
  anchor,
  open,
  setOpen,
  onOpen,
  onClose,
  children,
  side,
  align,
  anchorOffset,
  alignmentOffset,
  displayInViewport,
  height,
  width,
  preventOverflow,
  pinPosition,
  variant,
  displayCloseButton,
}: AnchoredOverlayViewProps) {
  // Primer's AnchoredOverlay is fully controlled (it has no self-managed open state): it shows the
  // panel whenever `open` is true and reports gestures through onOpen/onClose. The leaf owns
  // visibility, seeded from the controlled `open` (defaulting to closed when unbound). The bound
  // `open` path stays the source of truth: one guarded effect syncs an external (agent) change into
  // local state so the panel can be reopened by setting the path back to true.
  const [isOpen, setIsOpen] = useState(open ?? false);

  // path -> local: react only to external `open` changes (`isOpen` intentionally omitted from deps;
  // react-hooks/exhaustive-deps is not enforced in the adapter package).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- guarded sync of the bound value into local state, by design
    if (open !== undefined && open !== isOpen) setIsOpen(open);
  }, [open]);

  // Open gesture (anchor click / key press): open locally, write `true` back through the bound
  // `open` (no-op when unbound), then fire the custom open hook.
  const handleOpen = () => {
    setIsOpen(true);
    setOpen?.(true);
    onOpen?.();
  };

  // Close gesture (Escape / outside-click / anchor re-click): close locally, write `false` back,
  // then fire the custom close hook. Primer's onClose passes a gesture argument our authored
  // Action does not consume.
  const handleClose = () => {
    setIsOpen(false);
    setOpen?.(false);
    onClose?.();
  };

  return (
    <PrimerAnchoredOverlay
      open={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      // The synthetic `anchor` is wrapped in a ref-bearing element that receives the positioning ref
      // and the open/close gesture handlers Primer spreads (ref/id/aria-*/tabIndex/onClick/onKeyDown);
      // the referenced component renders inside as the visible trigger.
      renderAnchor={anchorProps => <span {...anchorProps}>{anchor}</span>}
      side={side}
      align={align}
      anchorOffset={anchorOffset}
      alignmentOffset={alignmentOffset}
      displayInViewport={displayInViewport}
      height={height}
      width={width}
      preventOverflow={preventOverflow}
      pinPosition={pinPosition}
      variant={mapVariant(variant)}
      displayCloseButton={displayCloseButton}
    >
      {children}
    </PrimerAnchoredOverlay>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders AnchoredOverlayView. It wraps
 * Primer's self-contained `AnchoredOverlay`, which portals the panel to the body and manages its own
 * focus trap / Escape / outside-click.
 * - `props.anchor` is a resolved `ComponentId`, built with `buildChild` and handed to the wrapper
 *   passed to Primer's `renderAnchor`.
 * - `props.open` is the resolved boolean; `props.setOpen` is the binder's auto-generated two-way
 *   setter (GenerateSetters, from the DynamicBoolean prop), driven by the open/close gestures.
 * - `props.onOpen`/`props.onClose` resolve to () => void closures (event vs functionCall routing is
 *   the renderer's job).
 * - `props.children` is a resolved `ChildList` built into the panel content.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const AnchoredOverlayComponent = createComponentImplementation(
  AnchoredOverlayApi,
  ({props, buildChild}) => (
    <AnchoredOverlayView
      anchor={buildChild(props.anchor)}
      open={props.open}
      setOpen={props.setOpen}
      onOpen={props.onOpen}
      onClose={props.onClose}
      side={props.side}
      align={props.align}
      anchorOffset={props.anchorOffset}
      alignmentOffset={props.alignmentOffset}
      displayInViewport={props.displayInViewport}
      height={props.height}
      width={props.width}
      preventOverflow={props.preventOverflow}
      pinPosition={props.pinPosition}
      variant={props.variant}
      displayCloseButton={props.displayCloseButton}
    >
      {renderChildList(props.children, buildChild)}
    </AnchoredOverlayView>
  ),
);
