import type {ComponentType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListItemApi} from './actionlist-item.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

/**
 * The slot leaves an `ActionList.Item` can hold, routed to their Primer slot. All four are
 * marker-matched (`bridge`): Primer's `useSlots` detects them by the `__SLOT__` marker rather than
 * reference, so the leaf renders as today via `buildChild` inside a pass-through carrying the same
 * marker. Primer reads `Description.variant` / `TrailingAction.loading` off the matched element, so
 * those are forwarded. The label `Text` (and any other child) falls through to the item's content.
 */
const ITEM_SLOTS: SlotMap = {
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
type ActionListItemViewProps = {
  selected?: boolean;
  active?: boolean;
  variant?: 'default' | 'danger';
  size?: 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  inactiveText?: string;
  role?: string;
  onSelect?: () => void;
  children?: ReactNode;
};

/**
 * Primer ActionList.Item is a strict polymorphic whose per-element overloads reject a `role`
 * chosen at runtime from a union. Cast it to a plain component typed with exactly the prop surface
 * we drive; the `variant`/`size` enums are already validated by the schema.
 */
const Item = PrimerActionList.Item as unknown as ComponentType<{
  selected?: boolean;
  active?: boolean;
  variant?: 'default' | 'danger';
  size?: 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  inactiveText?: string;
  role?: string;
  onSelect?: () => void;
  children?: ReactNode;
}>;

export function ActionListItemView({
  selected,
  active,
  variant,
  size,
  disabled,
  loading,
  inactiveText,
  role,
  onSelect,
  children,
}: ActionListItemViewProps) {
  return (
    <Item
      selected={selected}
      active={active}
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      inactiveText={inactiveText}
      role={role}
      onSelect={onSelect}
    >
      {children}
    </Item>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListItemView.
 * - `props.children` (label + slot leaves) is a resolved `ChildList`; `renderSlottedChildList`
 *   routes each slot leaf into its Primer slot (see `ITEM_SLOTS`) so Primer's `useSlots` matches
 *   them instead of flattening the visuals/description into the label. The `context` gives each
 *   child's type via the surface model.
 * - `onSelect` performs the intrinsic optimistic two-way write (`setSelected`, the binder's
 *   auto-generated setter from the `DynamicBoolean` `selected` — a no-op for a literal/unset
 *   `selected`) BEFORE firing the optional `action`, so an event's `context` carries the new
 *   selection. `props.action` is the resolved () => void (event vs functionCall routing is the
 *   renderer's job).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListItemComponent = createComponentImplementation(
  ActionListItemApi,
  ({props, buildChild, context}) => {
    const selected = props.selected as boolean | undefined;
    const setSelected = (props as {setSelected?: (value: boolean) => void}).setSelected;
    const onSelect = () => {
      setSelected?.(!selected);
      props.action?.();
    };
    return (
      <ActionListItemView
        selected={selected}
        active={props.active}
        variant={props.variant}
        size={props.size}
        disabled={props.disabled}
        loading={props.loading}
        inactiveText={props.inactiveText}
        role={props.role}
        onSelect={onSelect}
      >
        {renderSlottedChildList(props.children, buildChild, context, ITEM_SLOTS)}
      </ActionListItemView>
    );
  },
);
