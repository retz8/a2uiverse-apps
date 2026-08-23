import type {ReactNode} from 'react';
import {Breadcrumbs as PrimerBreadcrumbs} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {BreadcrumbsApi} from './breadcrumbs.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children`; the enums pass through to Primer. */
type BreadcrumbsViewProps = {
  overflow?: 'wrap' | 'menu' | 'menu-with-root';
  variant?: 'normal' | 'spacious';
  children?: ReactNode;
};

export function BreadcrumbsView({overflow, variant, children}: BreadcrumbsViewProps) {
  return (
    <PrimerBreadcrumbs overflow={overflow} variant={variant}>
      {children}
    </PrimerBreadcrumbs>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders BreadcrumbsView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild`. Primer wraps each in an
 *   `<li>` of the crumb `<ol>` (no prop-cloning into children, so no context bridge is needed).
 * - `overflow`/`variant` resolve as STATIC pass-throughs. Breadcrumbs has no ComponentId/Action
 *   row beyond `children`, so there is no `onClick`. Props are passed explicitly (no spread):
 *   resolved props include extra binder setters.
 */
export const BreadcrumbsComponent = createComponentImplementation(
  BreadcrumbsApi,
  ({props, buildChild}) => (
    <BreadcrumbsView overflow={props.overflow} variant={props.variant}>
      {renderChildList(props.children, buildChild)}
    </BreadcrumbsView>
  ),
);
