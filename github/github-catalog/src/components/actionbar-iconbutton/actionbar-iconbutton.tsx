import type {ElementType} from 'react';
import {ActionBar as PrimerActionBar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionBarIconButtonApi} from './actionbar-iconbutton.schema';
import {iconComponent} from '../../shared/icon-component';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: `action` -> onClick (() => void), the required `icon` ComponentId -> a built
 * child (ReactNode), `disabled` -> the resolved boolean. `variant` is hardcoded to `invisible` by
 * ActionBar and `size` comes from the parent ActionBar context — neither is authored here.
 */
type ActionBarIconButtonViewProps = {
  onClick?: () => void;
  icon: ElementType;
  disabled?: boolean;
  accessibility?: ResolvedAccessibility;
};

export function ActionBarIconButtonView({
  onClick,
  icon,
  disabled,
  accessibility,
}: ActionBarIconButtonViewProps) {
  return (
    <PrimerActionBar.IconButton
      // The icon is a component (a built node wrapped via `iconComponent`) so Primer can invoke it
      // as `<Icon/>` on both the normal render and the overflow-menu path — the latter rebuilds the
      // collapsed item with `createElement(icon)`, where a built element throws React #130.
      icon={icon}
      aria-label={accessibility?.label ?? ''}
      aria-description={accessibility?.description}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionBarIconButtonView.
 * - `props.action` is resolved to a () => void closure (the renderer routes event vs functionCall)
 *   -> passed as onClick.
 * - `props.icon` (required ComponentId) is built via buildChild, then wrapped as a component
 *   (`iconComponent`) so Primer can invoke it as `<Icon/>` — including in the overflow menu.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Standalone (no ActionBar parent) the overflow registry no-ops and `size` falls back to the
 * ActionBar context default. Props are passed explicitly (no spread): resolved props include extra
 * binder setters.
 */
export const ActionBarIconButtonComponent = createComponentImplementation(
  ActionBarIconButtonApi,
  ({props, buildChild}) => (
    <ActionBarIconButtonView
      onClick={props.action}
      icon={iconComponent(buildChild(props.icon))}
      disabled={props.disabled}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    />
  ),
);
