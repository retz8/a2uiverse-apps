import {type ReactElement, type ReactNode, isValidElement} from 'react';
import {ActionMenu as PrimerActionMenu} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionMenuAnchorApi} from './actionmenu-anchor.schema';

/** Resolved props: the synthetic `child` ComponentId arrives as a single built node. */
type ActionMenuAnchorViewProps = {
  /** The built custom trigger (resolved `child`), rendered inside Primer's `ActionMenu.Anchor`. */
  child?: ReactNode;
};

export function ActionMenuAnchorView({child}: ActionMenuAnchorViewProps) {
  // Primer's `ActionMenu.Anchor` expects a single React element child; the parent `ActionMenu` wires
  // the toggle onto it, so the built trigger is presentational here. When nothing is built, render an
  // empty span so Anchor always has a valid element child.
  return (
    <PrimerActionMenu.Anchor>
      {isValidElement(child) ? (child as ReactElement) : <span />}
    </PrimerActionMenu.Anchor>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionMenuAnchorView.
 * - `props.child` (required ComponentId) is built via buildChild and rendered as the menu's custom
 *   trigger inside Primer's `ActionMenu.Anchor`. The referenced component is presentational in the
 *   anchor role — the trigger's click is owned by the parent `ActionMenu`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionMenuAnchorComponent = createComponentImplementation(
  ActionMenuAnchorApi,
  ({props, buildChild}) => <ActionMenuAnchorView child={buildChild(props.child)} />,
);
