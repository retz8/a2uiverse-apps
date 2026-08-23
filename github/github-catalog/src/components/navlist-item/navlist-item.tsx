import type {ComponentType, ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListItemApi} from './navlist-item.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

type AriaCurrent = 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';

/**
 * The slot leaves a `NavList.Item` can hold, routed to their Primer slot. Leading/trailing visuals,
 * description, and trailing action are marker-matched (`bridge`); `SubNav` is reference-matched only
 * (no `__SLOT__`), so its real component is rendered directly (`wrapChildren`). Primer reads
 * `Description.variant` / `TrailingAction.loading` off the matched element, so those are forwarded.
 * Any other child (the label `Text`) falls through to the item's main content.
 */
const ITEM_SLOTS: SlotMap = {
  'NavList.LeadingVisual': {mode: 'bridge', slot: PrimerNavList.LeadingVisual},
  'NavList.TrailingVisual': {mode: 'bridge', slot: PrimerNavList.TrailingVisual},
  'NavList.Description': {mode: 'bridge', slot: PrimerNavList.Description, forward: ['variant']},
  'NavList.TrailingAction': {
    mode: 'bridge',
    slot: PrimerNavList.TrailingAction,
    forward: ['loading'],
  },
  'NavList.SubNav': {
    mode: 'wrapChildren',
    component: PrimerNavList.SubNav as ComponentType<{children?: ReactNode}>,
  },
};

/** Resolved props: `children` arrives as a built `ChildList`; the Dynamic* strings resolve to plain strings. */
type NavListItemViewProps = {
  href?: string;
  ariaCurrent?: AriaCurrent;
  defaultOpen?: boolean;
  inactiveText?: string;
  children?: ReactNode;
};

export function NavListItemView({
  href,
  ariaCurrent,
  defaultOpen,
  inactiveText,
  children,
}: NavListItemViewProps) {
  return (
    <PrimerNavList.Item
      href={href}
      aria-current={ariaCurrent}
      defaultOpen={defaultOpen}
      inactiveText={inactiveText}
    >
      {children}
    </PrimerNavList.Item>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListItemView.
 * - `props.children` is a resolved `ChildList`; `renderSlottedChildList` routes each slot leaf into
 *   its Primer slot (see `ITEM_SLOTS`) so Primer's `useSlots` matches them instead of flattening the
 *   trail into the label. The `context` gives each child's type via the surface model.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const NavListItemComponent = createComponentImplementation(
  NavListItemApi,
  ({props, buildChild, context}) => (
    <NavListItemView
      href={props.href}
      ariaCurrent={props['aria-current']}
      defaultOpen={props.defaultOpen}
      inactiveText={props.inactiveText}
    >
      {renderSlottedChildList(props.children, buildChild, context, ITEM_SLOTS)}
    </NavListItemView>
  ),
);
