import {type ComponentProps, type ReactNode} from 'react';
import {ActionMenu as PrimerActionMenu} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionMenuOverlayApi} from './actionmenu-overlay.schema';
import {renderChildList} from '../../shared/child-list';

type PrimerOverlayProps = ComponentProps<typeof PrimerActionMenu.Overlay>;
type OverlaySide = PrimerOverlayProps['side'];
type OverlayAlign = PrimerOverlayProps['align'];
type OverlayVariant = PrimerOverlayProps['variant'];

/** The overlay's discrete sizing enums (from `Overlay` `widthMap`/`heightMap`). */
type OverlayWidth = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'auto';
type OverlayHeight =
  'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'auto' | 'initial' | 'fit-content';
type OverlayMaxHeight = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'fit-content';
type OverlayMaxWidth = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

/** The flat authored variant enum (over the narrow arm), mirroring `AnchoredOverlay`. */
export type ActionMenuOverlayVariant = 'anchored' | 'fullscreen';

/**
 * Projects the flat `variant` enum back onto Primer's `ResponsiveValue<'anchored', ...>`: the
 * `regular` arm is fixed to `'anchored'`, the authored value drives the only variable arm (`narrow`)
 * — so `'fullscreen'` → `{regular: 'anchored', narrow: 'fullscreen'}`. Undefined passes through so
 * Primer applies its own default.
 */
export function mapVariant(variant?: ActionMenuOverlayVariant): OverlayVariant {
  return variant === undefined
    ? undefined
    : ({regular: 'anchored', narrow: variant} as OverlayVariant);
}

/** Resolved props: the ChildList arrives as built `children`; the positioning/sizing enums pass through. */
type ActionMenuOverlayViewProps = {
  align?: OverlayAlign;
  side?: OverlaySide;
  variant?: ActionMenuOverlayVariant;
  displayInViewport?: boolean;
  width?: OverlayWidth;
  height?: OverlayHeight;
  maxHeight?: OverlayMaxHeight;
  maxWidth?: OverlayMaxWidth;
  children?: ReactNode;
};

/**
 * Primer's `ActionMenu.Overlay` type surfaces only the `Pick<AnchoredOverlayProps, ...>` positioning
 * props plus `children`; the discrete `Overlay` sizing enums come from the untyped
 * `Partial<OverlayProps>` half and are not on the narrowed component type. Cast to a plain component
 * typed with exactly the surface we drive; the enums are already validated by the schema.
 */
const Overlay = PrimerActionMenu.Overlay as unknown as (props: {
  align?: OverlayAlign;
  side?: OverlaySide;
  variant?: OverlayVariant;
  displayInViewport?: boolean;
  width?: OverlayWidth;
  height?: OverlayHeight;
  maxHeight?: OverlayMaxHeight;
  maxWidth?: OverlayMaxWidth;
  children?: ReactNode;
}) => ReactNode;

export function ActionMenuOverlayView({
  align,
  side,
  variant,
  displayInViewport,
  width,
  height,
  maxHeight,
  maxWidth,
  children,
}: ActionMenuOverlayViewProps) {
  return (
    <Overlay
      align={align}
      side={side}
      variant={mapVariant(variant)}
      displayInViewport={displayInViewport}
      width={width}
      height={height}
      maxHeight={maxHeight}
      maxWidth={maxWidth}
    >
      {children}
    </Overlay>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionMenuOverlayView. It renders
 * Primer's `ActionMenu.Overlay`, which reads the parent `ActionMenu`'s context (anchor / open state)
 * and positions the menu.
 * - `props.children` is a resolved `ChildList` (the `ActionList` menu content plus optional
 *   `ActionMenu.Divider`s); `renderChildList` builds each via `buildChild`, slotted by Primer.
 * - the positioning/sizing enums pass through; `variant` maps the flat enum onto Primer's responsive
 *   `{narrow}` shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionMenuOverlayComponent = createComponentImplementation(
  ActionMenuOverlayApi,
  ({props, buildChild}) => (
    <ActionMenuOverlayView
      align={props.align}
      side={props.side}
      variant={props.variant}
      displayInViewport={props.displayInViewport}
      width={props.width}
      height={props.height}
      maxHeight={props.maxHeight}
      maxWidth={props.maxWidth}
    >
      {renderChildList(props.children, buildChild)}
    </ActionMenuOverlayView>
  ),
);
