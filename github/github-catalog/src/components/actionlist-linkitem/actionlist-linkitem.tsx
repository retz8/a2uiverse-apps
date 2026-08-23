import type {ComponentType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListLinkItemApi} from './actionlist-linkitem.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

/**
 * The slot leaves an `ActionList.LinkItem` can hold, routed to their Primer slot — identical to the
 * `ActionList.Item` set. All four are marker-matched (`bridge`); Primer reads `Description.variant` /
 * `TrailingAction.loading` off the matched element, so those are forwarded. The label `Text` falls
 * through to the item's main content.
 */
const LINK_ITEM_SLOTS: SlotMap = {
  'ActionList.LeadingVisual': {mode: 'bridge', slot: PrimerActionList.LeadingVisual},
  'ActionList.TrailingVisual': {mode: 'bridge', slot: PrimerActionList.TrailingVisual},
  'ActionList.Description': {
    mode: 'bridge',
    slot: PrimerActionList.Description,
    forward: ['variant'],
  },
  'ActionList.TrailingAction': {
    mode: 'bridge',
    slot: PrimerActionList.TrailingAction,
    forward: ['loading'],
  },
};

/** Resolved props: Dynamic* resolve to primitives; the ChildList arrives as built `children`. */
type ActionListLinkItemViewProps = {
  href: string;
  active?: boolean;
  inactiveText?: string;
  variant?: 'default' | 'danger';
  size?: 'medium' | 'large';
  target?: '_self' | '_blank';
  children?: ReactNode;
};

/**
 * Primer ActionList.LinkItem is a strict polymorphic whose overloads reject a runtime-chosen prop
 * surface. Cast it to a plain component typed with exactly the props we drive; the `variant`/
 * `size`/`target` enums are already validated by the schema.
 */
const LinkItem = PrimerActionList.LinkItem as unknown as ComponentType<{
  href: string;
  active?: boolean;
  inactiveText?: string;
  variant?: 'default' | 'danger';
  size?: 'medium' | 'large';
  target?: '_self' | '_blank';
  children?: ReactNode;
}>;

export function ActionListLinkItemView({
  href,
  active,
  inactiveText,
  variant,
  size,
  target,
  children,
}: ActionListLinkItemViewProps) {
  return (
    <LinkItem
      href={href}
      active={active}
      inactiveText={inactiveText}
      variant={variant}
      size={size}
      target={target}
    >
      {children}
    </LinkItem>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListLinkItemView.
 * - `props.children` (label + slot leaves) is a resolved `ChildList`; `renderSlottedChildList`
 *   routes each slot leaf into its Primer slot (see `LINK_ITEM_SLOTS`) so Primer's `useSlots`
 *   matches them instead of flattening. `LinkItem` navigates via `href` (no `Action`/`onClick`).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListLinkItemComponent = createComponentImplementation(
  ActionListLinkItemApi,
  ({props, buildChild, context}) => (
    <ActionListLinkItemView
      href={props.href}
      active={props.active}
      inactiveText={props.inactiveText}
      variant={props.variant}
      size={props.size}
      target={props.target}
    >
      {renderSlottedChildList(props.children, buildChild, context, LINK_ITEM_SLOTS)}
    </ActionListLinkItemView>
  ),
);
