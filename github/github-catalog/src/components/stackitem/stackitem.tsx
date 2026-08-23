import type {ElementType, ReactNode} from 'react';
import {Stack as PrimerStack} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StackItemApi} from './stackitem.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved sizing prop: either a scalar boolean or Primer's `{narrow, regular, wide}` responsive map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; grow/shrink pass through (scalar or map). */
type StackItemViewProps = {
  as?: ElementType;
  grow?: Responsive<boolean>;
  shrink?: Responsive<boolean>;
  children?: ReactNode;
};

export function StackItemView({as, grow, shrink, children}: StackItemViewProps) {
  return (
    <PrimerStack.Item as={as} grow={grow} shrink={shrink}>
      {children}
    </PrimerStack.Item>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders StackItemView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild`.
 * - `grow`/`shrink` resolve as STATIC pass-throughs (scalar or responsive map). Props are passed
 *   explicitly (no spread): resolved props include extra binder setters.
 */
export const StackItemComponent = createComponentImplementation(
  StackItemApi,
  ({props, buildChild}) => (
    <StackItemView as={props.as} grow={props.grow} shrink={props.shrink}>
      {renderChildList(props.children, buildChild)}
    </StackItemView>
  ),
);
