import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderBreadcrumbsApi} from './pageheader-breadcrumbs.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; `hidden` passes through (forwarded
 * only when set, so Primer's per-region responsive default is preserved when unset). */
type PageHeaderBreadcrumbsViewProps = {
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderBreadcrumbsView({hidden, children}: PageHeaderBreadcrumbsViewProps) {
  return <PrimerPageHeader.Breadcrumbs hidden={hidden}>{children}</PrimerPageHeader.Breadcrumbs>;
}

export const PageHeaderBreadcrumbsComponent = createComponentImplementation(
  PageHeaderBreadcrumbsApi,
  ({props, buildChild}) => (
    <PageHeaderBreadcrumbsView hidden={props.hidden}>
      {renderChildList(props.children, buildChild)}
    </PageHeaderBreadcrumbsView>
  ),
);
