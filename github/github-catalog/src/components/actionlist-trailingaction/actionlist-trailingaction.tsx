import type {ComponentType, ElementType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListTrailingActionApi} from './actionlist-trailingaction.schema';

/** Resolved props: Dynamic* resolve to primitives, action -> onClick, the icon ComponentId -> a built child. */
type ActionListTrailingActionViewProps = {
  label: string;
  as?: 'button' | 'a';
  href?: string;
  loading?: boolean;
  onClick?: () => void;
  // The element-typed Primer icon slot, built from the required ComponentId child. Primer types it
  // ElementType, but it renders an element at runtime via react-is isElement (the Button icon path).
  icon?: ReactNode;
};

/**
 * Primer ActionList.TrailingAction is a strict polymorphic union (`as: 'button' | 'a'`) whose
 * overloads reject the combined channel surface the schema carries. Cast it to a plain component
 * typed with exactly the props we drive; `as` is schema-validated.
 */
const TrailingAction = PrimerActionList.TrailingAction as unknown as ComponentType<{
  label: string;
  as?: 'button' | 'a';
  href?: string;
  loading?: boolean;
  onClick?: () => void;
  icon?: ElementType;
}>;

export function ActionListTrailingActionView({
  label,
  as,
  href,
  loading,
  onClick,
  icon,
}: ActionListTrailingActionViewProps) {
  return (
    <TrailingAction
      as={as}
      href={href}
      loading={loading}
      onClick={onClick}
      icon={icon as unknown as ElementType}
      label={label}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListTrailingActionView.
 * - `props.action` is resolved to a () => void closure (event vs functionCall routing is the
 *   renderer's job) -> passed as onClick (button mode).
 * - `props.icon` (required ComponentId) is built via buildChild and passed as the icon slot;
 *   `props.label` is the resolved accessible name / visible text.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListTrailingActionComponent = createComponentImplementation(
  ActionListTrailingActionApi,
  ({props, buildChild}) => (
    <ActionListTrailingActionView
      label={props.label}
      as={props.as}
      href={props.href}
      loading={props.loading}
      onClick={props.action}
      icon={buildChild(props.icon)}
    />
  ),
);
