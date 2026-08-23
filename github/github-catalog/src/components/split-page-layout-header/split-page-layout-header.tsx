import type {ReactNode} from 'react';
import {SplitPageLayout as PrimerSplitPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SplitPageLayoutHeaderApi} from './split-page-layout-header.schema';
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

/** Resolved props: ChildList arrives as built `children`; the rest pass through. */
type SplitPageLayoutHeaderViewProps = {
  padding?: 'none' | 'condensed' | 'normal';
  divider?: RegionDivider;
  hidden?: Responsive<boolean>;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function SplitPageLayoutHeaderView({
  padding,
  divider,
  hidden,
  accessibility,
  children,
}: SplitPageLayoutHeaderViewProps) {
  return (
    <PrimerSplitPageLayout.Header
      padding={padding}
      divider={divider}
      hidden={hidden}
      aria-label={accessibility?.label}
    >
      {children}
    </PrimerSplitPageLayout.Header>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SplitPageLayoutHeaderView.
 * - `props.children` is a resolved `ChildList` built via `renderChildList`.
 * - `padding`/`divider`/`hidden` resolve as STATIC pass-throughs (scalar or responsive map).
 * - `props.accessibility` carries resolved (plain-string) label/description, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SplitPageLayoutHeaderComponent = createComponentImplementation(
  SplitPageLayoutHeaderApi,
  ({props, buildChild}) => (
    <SplitPageLayoutHeaderView
      padding={props.padding}
      divider={props.divider}
      hidden={props.hidden}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </SplitPageLayoutHeaderView>
  ),
);
