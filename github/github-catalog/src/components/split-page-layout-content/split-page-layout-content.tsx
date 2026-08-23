import type {ElementType, ReactNode} from 'react';
import {SplitPageLayout as PrimerSplitPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SplitPageLayoutContentApi} from './split-page-layout-content.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved responsive value: a scalar or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};
/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: ChildList arrives as built `children`; the rest pass through. */
type SplitPageLayoutContentViewProps = {
  as?: ElementType;
  width?: 'full' | 'medium' | 'large' | 'xlarge';
  padding?: 'none' | 'condensed' | 'normal';
  hidden?: Responsive<boolean>;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function SplitPageLayoutContentView({
  as,
  width,
  padding,
  hidden,
  accessibility,
  children,
}: SplitPageLayoutContentViewProps) {
  return (
    <PrimerSplitPageLayout.Content
      as={as}
      width={width}
      padding={padding}
      hidden={hidden}
      aria-label={accessibility?.label}
    >
      {children}
    </PrimerSplitPageLayout.Content>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SplitPageLayoutContentView.
 * - `props.children` is a resolved `ChildList` built via `renderChildList`.
 * - `as`/`width`/`padding`/`hidden` resolve as STATIC pass-throughs.
 * - `props.accessibility` carries resolved (plain-string) label/description, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SplitPageLayoutContentComponent = createComponentImplementation(
  SplitPageLayoutContentApi,
  ({props, buildChild}) => (
    <SplitPageLayoutContentView
      as={props.as}
      width={props.width}
      padding={props.padding}
      hidden={props.hidden}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </SplitPageLayoutContentView>
  ),
);
