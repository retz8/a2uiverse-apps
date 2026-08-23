import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderLeadingVisualApi} from './pageheader-leadingvisual.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; `hidden` passes through (forwarded
 * only when set, so Primer's per-region responsive default is preserved when unset). */
type PageHeaderLeadingVisualViewProps = {
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderLeadingVisualView({hidden, children}: PageHeaderLeadingVisualViewProps) {
  return (
    <PrimerPageHeader.LeadingVisual hidden={hidden}>{children}</PrimerPageHeader.LeadingVisual>
  );
}

export const PageHeaderLeadingVisualComponent = createComponentImplementation(
  PageHeaderLeadingVisualApi,
  ({props, buildChild}) => (
    <PageHeaderLeadingVisualView hidden={props.hidden}>
      {renderChildList(props.children, buildChild)}
    </PageHeaderLeadingVisualView>
  ),
);
