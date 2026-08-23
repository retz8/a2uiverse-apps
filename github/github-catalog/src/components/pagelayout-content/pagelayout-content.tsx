import type {ElementType, ReactNode} from 'react';
import {PageLayout as PrimerPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageLayoutContentApi} from './pagelayout-content.schema';
import {renderChildList} from '../../shared/child-list';

type Spacing = 'none' | 'condensed' | 'normal';
type SizeWidth = 'full' | 'medium' | 'large' | 'xlarge';
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: ChildList arrives as built `children`; scale/config props pass through. */
type PageLayoutContentViewProps = {
  as?: ElementType;
  width?: SizeWidth;
  padding?: Spacing;
  hidden?: Responsive<boolean>;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function PageLayoutContentView({
  as,
  width,
  padding,
  hidden,
  accessibility,
  children,
}: PageLayoutContentViewProps) {
  return (
    <PrimerPageLayout.Content
      as={as}
      width={width}
      padding={padding}
      hidden={hidden}
      aria-label={accessibility?.label}
    >
      {children}
    </PrimerPageLayout.Content>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PageLayoutContentView.
 * - `props.children` is a resolved `ChildList`, built via `renderChildList`.
 * - `as`/`width`/`padding`/`hidden` resolve as static pass-throughs; `accessibility` carries
 *   resolved (plain-string) label/description, so it is cast to the resolved shape (only `label` is
 *   forwarded — Primer's main landmark accepts `aria-label`/`aria-labelledby`, not
 *   `aria-description`).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PageLayoutContentComponent = createComponentImplementation(
  PageLayoutContentApi,
  ({props, buildChild}) => (
    <PageLayoutContentView
      as={props.as}
      width={props.width}
      padding={props.padding}
      hidden={props.hidden}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </PageLayoutContentView>
  ),
);
