import type {ComponentProps, ReactNode} from 'react';
import {SplitPageLayout as PrimerSplitPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SplitPageLayoutSidebarApi} from './split-page-layout-sidebar.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved responsive value: a scalar or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};
/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};
/** Sidebar width: a named size, or explicit min/default/max px constraints. */
type SidebarWidth = 'small' | 'medium' | 'large' | {min: string; default: string; max: string};
/** Primer's `SplitPageLayout.Sidebar` prop bag — the cast target for the polymorphic width union. */
type SidebarPrimerProps = ComponentProps<typeof PrimerSplitPageLayout.Sidebar>;

/** Resolved props: ChildList arrives as built `children`; `currentWidth` resolves to a number. */
type SplitPageLayoutSidebarViewProps = {
  position?: 'start' | 'end';
  width?: SidebarWidth;
  minWidth?: number;
  resizable?: boolean;
  /** The controlled live width in px; when set, resizes write back through `setCurrentWidth`. */
  currentWidth?: number;
  /** The binder's auto-generated two-way setter for `currentWidth`. */
  setCurrentWidth?: (width: number) => void;
  padding?: 'none' | 'condensed' | 'normal';
  divider?: 'none' | 'line';
  sticky?: boolean;
  responsiveVariant?: 'default' | 'fullscreen';
  hidden?: Responsive<boolean>;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function SplitPageLayoutSidebarView({
  position,
  width,
  minWidth,
  resizable,
  currentWidth,
  setCurrentWidth,
  padding,
  divider,
  sticky,
  responsiveVariant,
  hidden,
  accessibility,
  children,
}: SplitPageLayoutSidebarViewProps) {
  // Controlled resize: `currentWidth` + `onResizeEnd` are a paired arm of Primer's Sidebar type —
  // pass both together (bound path controlled) or neither (uncontrolled), never one alone.
  const resizeControl =
    currentWidth === undefined
      ? {}
      : {currentWidth, onResizeEnd: (nextWidth: number) => setCurrentWidth?.(nextWidth)};
  return (
    <PrimerSplitPageLayout.Sidebar
      position={position}
      width={width as SidebarPrimerProps['width']}
      minWidth={minWidth}
      resizable={resizable}
      padding={padding}
      divider={divider}
      sticky={sticky}
      responsiveVariant={responsiveVariant}
      hidden={hidden}
      aria-label={accessibility?.label}
      {...resizeControl}
    >
      {children}
    </PrimerSplitPageLayout.Sidebar>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SplitPageLayoutSidebarView.
 * - `props.children` is a resolved `ChildList` built via `renderChildList`.
 * - `props.currentWidth` is the resolved number; `props.setCurrentWidth` is the auto-generated
 *   two-way setter wired onto `onResizeEnd` (the Checkbox/Details controlled pattern).
 * - `props.accessibility` carries resolved (plain-string) label/description, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SplitPageLayoutSidebarComponent = createComponentImplementation(
  SplitPageLayoutSidebarApi,
  ({props, buildChild}) => (
    <SplitPageLayoutSidebarView
      position={props.position}
      width={props.width}
      minWidth={props.minWidth}
      resizable={props.resizable}
      currentWidth={props.currentWidth}
      setCurrentWidth={props.setCurrentWidth}
      padding={props.padding}
      divider={props.divider}
      sticky={props.sticky}
      responsiveVariant={props.responsiveVariant}
      hidden={props.hidden}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </SplitPageLayoutSidebarView>
  ),
);
