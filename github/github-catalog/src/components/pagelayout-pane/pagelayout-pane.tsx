import type {ComponentProps, ReactNode} from 'react';
import {PageLayout as PrimerPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageLayoutPaneApi} from './pagelayout-pane.schema';
import {renderChildList} from '../../shared/child-list';

type Spacing = 'none' | 'condensed' | 'normal';
type Divider =
  | 'none'
  | 'line'
  | {narrow?: 'none' | 'line' | 'filled'; regular?: 'none' | 'line'; wide?: 'none' | 'line'};
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};
type PaneWidth = 'small' | 'medium' | 'large' | {min: string; default: string; max: string};
/** Primer's own width union (its custom arm uses `${number}px` template literals). */
type PrimerPaneWidth = ComponentProps<typeof PrimerPageLayout.Pane>['width'];

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Primer's controlled/uncontrolled resize union: either `{onResizeEnd, currentWidth}` together
 * (controlled) or neither (uncontrolled, localStorage-persisted via `widthStorageKey`).
 */
type ResizeProps =
  | {onResizeEnd: (width: number) => void; currentWidth: number | undefined}
  | {onResizeEnd?: never; currentWidth?: never};

/** Resolved props: ChildList arrives as built `children`; the resize write-back is setCurrentWidth. */
type PageLayoutPaneViewProps = {
  position?: Responsive<'start' | 'end'>;
  width?: PaneWidth;
  minWidth?: number;
  padding?: Spacing;
  divider?: Divider;
  sticky?: boolean;
  offsetHeader?: number | string;
  hidden?: Responsive<boolean>;
  resizable?: boolean;
  widthStorageKey?: string;
  accessibility?: ResolvedAccessibility;
  /** The resolved controlled width (present only when `currentWidth` was bound). */
  currentWidth?: number;
  /** The binder's auto-generated two-way setter for `currentWidth`; wired to Primer's onResizeEnd. */
  setCurrentWidth?: (width: number) => void;
  children?: ReactNode;
};

export function PageLayoutPaneView({
  position,
  width,
  minWidth,
  padding,
  divider,
  sticky,
  offsetHeader,
  hidden,
  resizable,
  widthStorageKey,
  accessibility,
  currentWidth,
  setCurrentWidth,
  children,
}: PageLayoutPaneViewProps) {
  // Controlled when `currentWidth` is bound (its setter exists): pass the width + the write-back
  // together. Otherwise uncontrolled — omit both so Primer persists via `widthStorageKey`.
  const resizeProps: ResizeProps = setCurrentWidth
    ? {onResizeEnd: setCurrentWidth, currentWidth}
    : {};

  return (
    <PrimerPageLayout.Pane
      position={position}
      width={width as PrimerPaneWidth}
      minWidth={minWidth}
      padding={padding}
      divider={divider}
      sticky={sticky}
      offsetHeader={offsetHeader}
      hidden={hidden}
      resizable={resizable}
      widthStorageKey={widthStorageKey}
      aria-label={accessibility?.label}
      {...resizeProps}
    >
      {children}
    </PrimerPageLayout.Pane>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PageLayoutPaneView.
 * - `props.children` is a resolved `ChildList`, built via `renderChildList`.
 * - `props.currentWidth` is the resolved controlled width; `props.setCurrentWidth` is the binder's
 *   auto-generated setter (GenerateSetters, from the DynamicNumber prop) wired to Primer's
 *   `onResizeEnd` so a resize drag writes the new width back to the bound path. No `onResizeEnd`
 *   Action — the resize *is* the write-back (the Checkbox pattern).
 * - The remaining props resolve as static pass-throughs; `accessibility` is cast to the resolved
 *   shape (only `label` is forwarded).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PageLayoutPaneComponent = createComponentImplementation(
  PageLayoutPaneApi,
  ({props, buildChild}) => (
    <PageLayoutPaneView
      position={props.position}
      width={props.width}
      minWidth={props.minWidth}
      padding={props.padding}
      divider={props.divider}
      sticky={props.sticky}
      offsetHeader={props.offsetHeader}
      hidden={props.hidden}
      resizable={props.resizable}
      widthStorageKey={props.widthStorageKey}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
      currentWidth={props.currentWidth}
      setCurrentWidth={(props as {setCurrentWidth?: (width: number) => void}).setCurrentWidth}
    >
      {renderChildList(props.children, buildChild)}
    </PageLayoutPaneView>
  ),
);
