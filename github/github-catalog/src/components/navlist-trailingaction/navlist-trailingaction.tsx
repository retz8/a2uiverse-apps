import type {ElementType, ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListTrailingActionApi} from './navlist-trailingaction.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: `action` -> onClick (() => void), `icon` -> a built child (ReactNode),
 * `loading` -> the resolved boolean, plus the accessibility label.
 */
type NavListTrailingActionViewProps = {
  onClick?: () => void;
  icon?: ReactNode;
  loading?: boolean;
  accessibility?: ResolvedAccessibility;
};

export function NavListTrailingActionView({
  onClick,
  icon,
  loading,
  accessibility,
}: NavListTrailingActionViewProps) {
  return (
    <PrimerNavList.TrailingAction
      // Primer renders the icon via IconButton, which accepts an already-built element directly
      // (react-is isElement); the type wants a component, so it is cast.
      icon={icon as unknown as ElementType}
      // The icon-only control's accessible name (Primer maps `label` -> aria-label).
      label={accessibility?.label ?? ''}
      loading={loading}
      onClick={onClick}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListTrailingActionView.
 * - `props.action` is resolved to a () => void closure (the renderer routes event vs functionCall)
 *   -> passed as onClick.
 * - `props.icon` (required ComponentId) is built via buildChild and passed as the icon slot.
 * - `props.accessibility` carries a resolved (plain-string) label at runtime; its inferred type
 *   still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const NavListTrailingActionComponent = createComponentImplementation(
  NavListTrailingActionApi,
  ({props, buildChild}) => (
    <NavListTrailingActionView
      onClick={props.action}
      icon={buildChild(props.icon)}
      loading={props.loading}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    />
  ),
);
