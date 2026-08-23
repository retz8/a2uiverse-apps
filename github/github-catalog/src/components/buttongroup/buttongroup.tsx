import type {ComponentType, ReactNode} from 'react';
import {ButtonGroup as PrimerButtonGroup} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ButtonGroupApi} from './buttongroup.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: ChildList arrives as built `children`; `role`/`as` pass through as scalars. */
type ButtonGroupViewProps = {
  as?: 'div' | 'span';
  role?: 'group' | 'toolbar';
  children?: ReactNode;
};

/**
 * Primer ButtonGroup is a strict polymorphic (`PolymorphicForwardRefComponent<"div", …>`)
 * whose per-element overloads reject an `as` chosen at runtime from a union. Cast it to a
 * plain component typed with exactly the prop surface we drive; the `as`/`role` enums are
 * already validated by the schema, so the cast is sound.
 */
const ButtonGroup = PrimerButtonGroup as unknown as ComponentType<{
  as?: 'div' | 'span';
  role?: 'group' | 'toolbar';
  children?: ReactNode;
}>;

export function ButtonGroupView({as, role, children}: ButtonGroupViewProps) {
  return (
    <ButtonGroup as={as} role={role}>
      {children}
    </ButtonGroup>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ButtonGroupView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild`. Primer wraps each in its
 *   own `<div>` internally and applies the shared-border joined-row styling.
 * - `role`/`as` resolve as STATIC pass-throughs — forwarded to Primer (`role` onto the DOM role
 *   attribute, plus arrow-key roving focus when `toolbar`; `as` as the container tag). Props are
 *   passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ButtonGroupComponent = createComponentImplementation(
  ButtonGroupApi,
  ({props, buildChild}) => (
    <ButtonGroupView as={props.as} role={props.role}>
      {renderChildList(props.children, buildChild)}
    </ButtonGroupView>
  ),
);
