import type {ReactElement, ElementType, ReactNode} from 'react';
import {ActionMenu as PrimerActionMenu} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionMenuButtonApi} from './actionmenu-button.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: Dynamic* resolve to primitives and each element-typed ComponentId slot arrives as
 * a built child. `ActionMenu.Button` is the `Button` surface minus `action` — Primer owns the
 * trigger's click, so there is no `onClick`.
 */
type ActionMenuButtonViewProps = {
  variant?: 'default' | 'primary' | 'invisible' | 'danger' | 'link';
  size?: 'small' | 'medium' | 'large';
  alignContent?: 'start' | 'center';
  disabled?: boolean;
  loading?: boolean;
  inactive?: boolean;
  block?: boolean;
  labelWrap?: boolean;
  loadingAnnouncement?: string;
  count?: string; // Primer accepts number | string; the binder only ever resolves DynamicString to a string here.
  accessibility?: ResolvedAccessibility;
  // Element-typed Primer slots, each built from a ComponentId child.
  icon?: ReactNode;
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
  trailingAction?: ReactNode;
  children?: ReactNode;
};

export function ActionMenuButtonView({
  variant,
  size,
  alignContent,
  disabled,
  loading,
  inactive,
  block,
  labelWrap,
  loadingAnnouncement,
  count,
  accessibility,
  icon,
  leadingVisual,
  trailingVisual,
  trailingAction,
  children,
}: ActionMenuButtonViewProps) {
  return (
    <PrimerActionMenu.Button
      variant={variant}
      size={size}
      alignContent={alignContent}
      disabled={disabled}
      loading={loading}
      inactive={inactive}
      block={block}
      labelWrap={labelWrap}
      loadingAnnouncement={loadingAnnouncement}
      count={count}
      icon={icon as ReactElement | undefined}
      leadingVisual={leadingVisual as ReactElement | undefined}
      trailingVisual={trailingVisual as ReactElement | undefined}
      trailingAction={trailingAction as unknown as ElementType | undefined}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {children}
    </PrimerActionMenu.Button>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionMenuButtonView.
 * - `props.child` (optional) and the four ComponentId slots are resolved via buildChild, each
 *   guarded on presence (buildChild requires a string id). `child` is omitted in Primer's icon-only
 *   mode.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its inferred
 *   type still shows the nested DynamicString, so it is cast to the resolved shape.
 * There is no `action`/onClick — the click is owned by the parent `ActionMenu`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionMenuButtonComponent = createComponentImplementation(
  ActionMenuButtonApi,
  ({props, buildChild}) => (
    <ActionMenuButtonView
      variant={props.variant}
      size={props.size}
      alignContent={props.alignContent}
      disabled={props.disabled}
      loading={props.loading}
      inactive={props.inactive}
      block={props.block}
      labelWrap={props.labelWrap}
      loadingAnnouncement={props.loadingAnnouncement}
      count={props.count}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
      icon={props.icon ? buildChild(props.icon) : undefined}
      leadingVisual={props.leadingVisual ? buildChild(props.leadingVisual) : undefined}
      trailingVisual={props.trailingVisual ? buildChild(props.trailingVisual) : undefined}
      trailingAction={props.trailingAction ? buildChild(props.trailingAction) : undefined}
    >
      {props.child ? buildChild(props.child) : undefined}
    </ActionMenuButtonView>
  ),
);
