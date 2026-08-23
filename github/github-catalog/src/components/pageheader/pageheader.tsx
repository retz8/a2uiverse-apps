import type {ComponentProps, ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderApi} from './pageheader.schema';
import {renderChildList} from '../../shared/child-list';

/** Primer's closed `role` union, derived from the component's own props (no internal import). */
type PrimerAriaRole = ComponentProps<typeof PrimerPageHeader>['role'];

/** Resolved props: ChildList arrives as built `children`; the rest pass through post-binder. */
type PageHeaderViewProps = {
  as?: 'header' | 'div';
  role?: string;
  hasBorder?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
};

export function PageHeaderView({as, role, hasBorder, ariaLabel, children}: PageHeaderViewProps) {
  return (
    <PrimerPageHeader
      as={as as 'div'}
      role={role as PrimerAriaRole}
      hasBorder={hasBorder}
      aria-label={ariaLabel}
    >
      {children}
    </PrimerPageHeader>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PageHeaderView.
 * `props.children` is a resolved `ChildList`; `renderChildList` builds each region via
 * `buildChild`. Props are passed explicitly (no spread): resolved props include extra setters.
 */
export const PageHeaderComponent = createComponentImplementation(
  PageHeaderApi,
  ({props, buildChild}) => (
    <PageHeaderView
      as={props.as}
      role={props.role}
      hasBorder={props.hasBorder}
      ariaLabel={props['aria-label']}
    >
      {renderChildList(props.children, buildChild)}
    </PageHeaderView>
  ),
);
