import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderContextAreaActionsApi} from './pageheader-contextareaactions.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; `hidden` passes through (forwarded
 * only when set, so Primer's per-region responsive default is preserved when unset). */
type PageHeaderContextAreaActionsViewProps = {
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderContextAreaActionsView({
  hidden,
  children,
}: PageHeaderContextAreaActionsViewProps) {
  return (
    <PrimerPageHeader.ContextAreaActions hidden={hidden}>
      {children}
    </PrimerPageHeader.ContextAreaActions>
  );
}

export const PageHeaderContextAreaActionsComponent = createComponentImplementation(
  PageHeaderContextAreaActionsApi,
  ({props, buildChild}) => (
    <PageHeaderContextAreaActionsView hidden={props.hidden}>
      {renderChildList(props.children, buildChild)}
    </PageHeaderContextAreaActionsView>
  ),
);
