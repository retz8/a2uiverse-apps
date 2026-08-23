import type {ElementType, ReactNode} from 'react';
import {LabelGroup as PrimerLabelGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {LabelGroupApi} from './label-group.schema';
import {renderChildList} from '../../shared/child-list';

/**
 * Resolved props: the `ChildList` arrives as built `children`; `overflowStyle`, `visibleChildCount`
 * and `as` pass straight through to Primer, which owns the overflow affordance (the `+N` expand
 * button, the inline/overlay reveal, and the fit-to-container measurement for `'auto'`).
 */
type LabelGroupViewProps = {
  as?: ElementType;
  overflowStyle?: 'inline' | 'overlay';
  visibleChildCount?: 'auto' | number;
  children?: ReactNode;
};

export function LabelGroupView({
  as,
  overflowStyle,
  visibleChildCount,
  children,
}: LabelGroupViewProps) {
  return (
    <PrimerLabelGroup as={as} overflowStyle={overflowStyle} visibleChildCount={visibleChildCount}>
      {children}
    </PrimerLabelGroup>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders LabelGroupView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild` as direct group children.
 * - `overflowStyle` / `visibleChildCount` / `as` resolve as STATIC pass-throughs. Props are passed
 *   explicitly (no spread): resolved props include extra binder setters.
 */
export const LabelGroupComponent = createComponentImplementation(
  LabelGroupApi,
  ({props, buildChild}) => (
    <LabelGroupView
      as={props.as}
      overflowStyle={props.overflowStyle}
      visibleChildCount={props.visibleChildCount}
    >
      {renderChildList(props.children, buildChild)}
    </LabelGroupView>
  ),
);
