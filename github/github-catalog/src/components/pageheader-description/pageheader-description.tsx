import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderDescriptionApi} from './pageheader-description.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; `hidden` passes through (forwarded
 * only when set, so Primer's per-region responsive default is preserved when unset). */
type PageHeaderDescriptionViewProps = {
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderDescriptionView({hidden, children}: PageHeaderDescriptionViewProps) {
  return <PrimerPageHeader.Description hidden={hidden}>{children}</PrimerPageHeader.Description>;
}

export const PageHeaderDescriptionComponent = createComponentImplementation(
  PageHeaderDescriptionApi,
  ({props, buildChild}) => (
    <PageHeaderDescriptionView hidden={props.hidden}>
      {renderChildList(props.children, buildChild)}
    </PageHeaderDescriptionView>
  ),
);
