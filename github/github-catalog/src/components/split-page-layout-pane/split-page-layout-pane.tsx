import type {ComponentProps, ReactNode} from 'react';
import {SplitPageLayout as PrimerSplitPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SplitPageLayoutPaneApi} from './split-page-layout-pane.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved responsive value: a scalar or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};
/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};
/** The divider carries `'filled'` only on the narrow arm (a narrow-viewport variant). */
type RegionDivider =
  | 'none'
  | 'line'
  | {narrow?: 'none' | 'line' | 'filled'; regular?: 'none' | 'line'; wide?: 'none' | 'line'};
/** Pane's width: a named size, or explicit min/default/max px constraints. */
type PaneWidth = 'small' | 'medium' | 'large' | {min: string; default: string; max: string};
/** Primer's `SplitPageLayout.Pane` prop bag — the cast target for the polymorphic width/resize union. */
type PanePrimerProps = ComponentProps<typeof PrimerSplitPageLayout.Pane>;

/** Resolved props: ChildList arrives as built `children`; `currentWidth` resolves to a number. */
type SplitPageLayoutPaneViewProps = {
  position?: Responsive<'start' | 'end'>;
  width?: PaneWidth;
  minWidth?: number;
  padding?: 'none' | 'condensed' | 'normal';
  divider?: RegionDivider;
  sticky?: boolean;
  offsetHeader?: string | number;
  hidden?: Responsive<boolean>;
  resizable?: boolean;
  /** The controlled live width in px; when set, resizes write back through `setCurrentWidth`. */
  currentWidth?: number;
  /** The binder's auto-generated two-way setter for `currentWidth`. */
  setCurrentWidth?: (width: number) => void;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function SplitPageLayoutPaneView({
  position,
  width,
  minWidth,
  padding,
  divider,
  sticky,
  offsetHeader,
  hidden,
  resizable,
  currentWidth,
  setCurrentWidth,
  accessibility,
  children,
}: SplitPageLayoutPaneViewProps) {
  // Controlled resize: `currentWidth` + `onResizeEnd` are a paired arm of Primer's Pane type — pass
  // both together (bound path controlled) or neither (uncontrolled), never one alone.
  const resizeControl =
    currentWidth === undefined
      ? {}
      : {currentWidth, onResizeEnd: (nextWidth: number) => setCurrentWidth?.(nextWidth)};
  return (
    <PrimerSplitPageLayout.Pane
      position={position}
      width={width as PanePrimerProps['width']}
      minWidth={minWidth}
      padding={padding}
      divider={divider}
      sticky={sticky}
      offsetHeader={offsetHeader}
      hidden={hidden}
      resizable={resizable}
      aria-label={accessibility?.label}
      {...resizeControl}
    >
      {children}
    </PrimerSplitPageLayout.Pane>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SplitPageLayoutPaneView.
 * - `props.children` is a resolved `ChildList` built via `renderChildList`.
 * - `props.currentWidth` is the resolved number; `props.setCurrentWidth` is the auto-generated
 *   two-way setter (from the DynamicNumber prop) wired onto `onResizeEnd` so a drag-resize flows
 *   back to the bound data-model path (the Checkbox/Details controlled pattern).
 * - `props.accessibility` carries resolved (plain-string) label/description, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SplitPageLayoutPaneComponent = createComponentImplementation(
  SplitPageLayoutPaneApi,
  ({props, buildChild}) => (
    <SplitPageLayoutPaneView
      position={props.position}
      width={props.width}
      minWidth={props.minWidth}
      padding={props.padding}
      divider={props.divider}
      sticky={props.sticky}
      offsetHeader={props.offsetHeader}
      hidden={props.hidden}
      resizable={props.resizable}
      currentWidth={props.currentWidth}
      setCurrentWidth={props.setCurrentWidth}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </SplitPageLayoutPaneView>
  ),
);
