import {type ComponentProps, type ElementType, type ReactNode} from 'react';
import {ActionBar as PrimerActionBar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {ComponentContext} from '@a2ui/web_core/v0_9';
import {ActionBarMenuApi} from './actionbar-menu.schema';
import {iconComponent} from '../../shared/icon-component';

/** `buildChild` from the a2ui react binder: resolves a component id to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** Resolved accessibility: the nested DynamicString is a plain string after the binder resolves it. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * A menu entry AFTER binder resolution: `action` is a ready-to-call closure, `leadingVisual` /
 * `trailingVisual` are plain strings (a ComponentId, or — for trailingVisual — literal text). The
 * inferred prop type still shows the raw pre-resolution shapes, so `props.items` is cast to this.
 */
type ResolvedMenuItem = {
  type?: 'action' | 'divider';
  label?: string;
  action?: () => void;
  disabled?: boolean;
  leadingVisual?: string;
  trailingVisual?: string;
  variant?: 'default' | 'danger';
  items?: ResolvedMenuItem[];
};

/** Primer's menu-item and menu-prop shapes, derived from the component (the named type is not
 * re-exported at the package root). */
type PrimerActionBarMenuProps = ComponentProps<typeof PrimerActionBar.Menu>;
type PrimerMenuItem = PrimerActionBarMenuProps['items'][number];
type PrimerOverflowIcon = PrimerActionBarMenuProps['overflowIcon'];

/** Resolves a `trailingVisual` string: an id that names a real component in the surface is an icon
 * (built + wrapped); anything else is literal trailing text (Primer renders it in a span). */
function resolveTrailingVisual(
  value: string | undefined,
  buildChild: BuildChild,
  context: ComponentContext,
): ElementType | string | undefined {
  if (value === undefined) return undefined;
  return context.surfaceComponents.get(value) ? iconComponent(buildChild(value)) : value;
}

/** Transcribes one resolved A2UI menu entry into Primer's `items` entry, recursing into submenus. */
function toPrimerItem(
  item: ResolvedMenuItem,
  buildChild: BuildChild,
  context: ComponentContext,
): PrimerMenuItem {
  if (item.type === 'divider') return {type: 'divider'};
  return {
    type: 'action',
    label: item.label ?? '',
    onClick: item.action,
    disabled: item.disabled,
    variant: item.variant,
    leadingVisual: item.leadingVisual ? iconComponent(buildChild(item.leadingVisual)) : undefined,
    trailingVisual: resolveTrailingVisual(item.trailingVisual, buildChild, context),
    items: item.items?.map(sub => toPrimerItem(sub, buildChild, context)),
  };
}

/** Resolved props: the icon is a component (built node wrapped via `iconComponent`), `items` are
 * already in Primer's shape. */
type ActionBarMenuViewProps = {
  icon: ElementType;
  label?: string;
  items: PrimerMenuItem[];
  overflowIcon?: PrimerOverflowIcon;
};

export function ActionBarMenuView({icon, label, items, overflowIcon}: ActionBarMenuViewProps) {
  return (
    <PrimerActionBar.Menu
      // The icon is a component (a built node wrapped via `iconComponent`) so Primer can invoke it
      // as `<Icon/>` on both the normal and the overflow-menu paths (the latter calls it strictly
      // as a component type — a built element throws React #130 there).
      icon={icon}
      aria-label={label ?? ''}
      items={items}
      overflowIcon={overflowIcon}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionBarMenuView.
 * - `props.icon` (required ComponentId) is built via buildChild and passed as the menu button's
 *   icon slot.
 * - `props.items` is resolved deeply by the binder — each entry's `action` is a ready-to-call
 *   closure (passed as Primer's per-item `onClick`), and icon references are built via buildChild.
 * - `props.accessibility.label` is the required menu-button accessible name -> `aria-label`.
 * - `props.overflowIcon` ('none' or a ComponentId) controls the icon when the menu collapses into
 *   a parent ActionBar's overflow menu.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionBarMenuComponent = createComponentImplementation(
  ActionBarMenuApi,
  ({props, buildChild, context}) => {
    const items = (props.items ?? []) as unknown as ResolvedMenuItem[];
    const accessibility = props.accessibility as ResolvedAccessibility | undefined;
    const overflowIconRaw = props.overflowIcon as string | undefined;
    const overflowIcon: PrimerOverflowIcon =
      overflowIconRaw === undefined
        ? undefined
        : overflowIconRaw === 'none'
          ? 'none'
          : (iconComponent(buildChild(overflowIconRaw)) as PrimerOverflowIcon);

    return (
      <ActionBarMenuView
        icon={iconComponent(buildChild(props.icon))}
        label={accessibility?.label}
        items={items.map(item => toPrimerItem(item, buildChild, context))}
        overflowIcon={overflowIcon}
      />
    );
  },
);
