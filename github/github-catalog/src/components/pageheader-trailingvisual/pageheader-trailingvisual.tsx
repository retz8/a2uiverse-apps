import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderTrailingVisualApi} from './pageheader-trailingvisual.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; `hidden` passes through (forwarded
 * only when set, so Primer's per-region responsive default is preserved when unset). */
type PageHeaderTrailingVisualViewProps = {
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderTrailingVisualView({
  hidden,
  children,
}: PageHeaderTrailingVisualViewProps) {
  return (
    <PrimerPageHeader.TrailingVisual hidden={hidden}>{children}</PrimerPageHeader.TrailingVisual>
  );
}

export const PageHeaderTrailingVisualComponent = createComponentImplementation(
  PageHeaderTrailingVisualApi,
  ({props, buildChild}) => (
    <PageHeaderTrailingVisualView hidden={props.hidden}>
      {renderChildList(props.children, buildChild)}
    </PageHeaderTrailingVisualView>
  ),
);
