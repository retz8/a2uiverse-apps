import type {ComponentProps, ComponentType, ReactNode} from 'react';
import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewItemApi} from './treeview-item.schema';
import {renderSlottedChildList, type SlotMap} from '../../shared/slotted-child-list';

/** A reference-matched slot component that also carries element-level props (e.g. `label`). */
type SlotWithProps = ComponentType<{children?: ReactNode; [prop: string]: unknown}>;

/**
 * The slot leaves a `TreeView.Item` can hold, routed to their Primer slot. `SubTree` carries a
 * `__SLOT__` marker, so a marker `bridge` routes it (the leaf renders as today via `buildChild`,
 * preserving `state`/`count`/`aria-label`) — this is what gates the item behind expand state and
 * reveals the twisty. Primer's TreeView visuals carry **no** marker (matched by reference only) and
 * hold their icon under a `child` ComponentId plus a `label`, so `wrapChild` renders the real Primer
 * component with the icon built inside and `label` forwarded. The label `Text` (and any other child)
 * falls through to the item's content.
 */
const ITEM_SLOTS: SlotMap = {
  TreeViewSubTree: {mode: 'bridge', slot: PrimerTreeView.SubTree},
  TreeViewLeadingVisual: {
    mode: 'wrapChild',
    component: PrimerTreeView.LeadingVisual as SlotWithProps,
    forward: ['label'],
  },
  TreeViewTrailingVisual: {
    mode: 'wrapChild',
    component: PrimerTreeView.TrailingVisual as SlotWithProps,
    forward: ['label'],
  },
};

/** A `secondaryActions` element after the binder resolves it: Dynamic* -> primitives, the
 * `icon` ComponentId stays a string id, and `action` resolves to a () => void closure. */
type ResolvedSecondaryAction = {
  label: string;
  icon: string;
  count?: string;
  action: () => void;
};

/** The secondaryActions shape Primer's Item consumes; the `icon` is a built React node (Primer
 * types it as an octicon component but renders a ReactNode via IconButton's react-is element path). */
type PrimerSecondaryAction = {
  key: number;
  label: string;
  count?: string;
  onClick: () => void;
  icon: ReactNode;
};

/** Primer's own Item props, used to cast the pre-built secondaryActions at the render boundary. */
type PrimerItemSecondaryActions = ComponentProps<typeof PrimerTreeView.Item>['secondaryActions'];

/** Resolved props: ChildList -> built `children`; `expanded` two-way write-back is
 * `onExpandedChange`; `action` -> `onSelect`; `secondaryActions` are pre-built for Primer. */
type TreeViewItemViewProps = {
  id: string;
  expanded?: boolean;
  current?: boolean;
  containIntrinsicSize?: string;
  onSelect?: () => void;
  /** The two-way write-back: the binder's auto-generated setExpanded, called with the new state. */
  onExpandedChange?: (expanded: boolean) => void;
  secondaryActions?: PrimerSecondaryAction[];
  children?: ReactNode;
};

export function TreeViewItemView({
  id,
  expanded,
  current,
  containIntrinsicSize,
  onSelect,
  onExpandedChange,
  secondaryActions,
  children,
}: TreeViewItemViewProps) {
  return (
    <PrimerTreeView.Item
      id={id}
      expanded={expanded}
      current={current}
      containIntrinsicSize={containIntrinsicSize}
      onSelect={onSelect}
      onExpandedChange={onExpandedChange}
      secondaryActions={secondaryActions as unknown as PrimerItemSecondaryActions}
    >
      {children}
    </PrimerTreeView.Item>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TreeViewItemView.
 * - the Primer `id` is the component-envelope id (`context.componentModel.id`), required on every
 *   component — not a schema prop.
 * - `props.children` (required ChildList) is routed via `renderSlottedChildList` (see `ITEM_SLOTS`)
 *   so Primer's slot detection places the subtree/visuals instead of flattening them into the label;
 *   the `context` gives each child's type via the surface model.
 * - `props.expanded` is the resolved boolean; `props.setExpanded` is the auto-generated two-way
 *   setter (from the DynamicBoolean prop) wired to `onExpandedChange` so a user toggle writes back.
 * - `props.action` resolves to a () => void closure -> `onSelect` (Primer passes an event the
 *   closure ignores).
 * - `props.secondaryActions` resolve to `{label, icon(id), count?, action}`; each is mapped to
 *   Primer's shape — the `icon` id built via `buildChild`, `action` as `onClick`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TreeViewItemComponent = createComponentImplementation(
  TreeViewItemApi,
  ({props, buildChild, context}) => {
    const resolvedActions = props.secondaryActions as ResolvedSecondaryAction[] | undefined;
    const secondaryActions: PrimerSecondaryAction[] | undefined = resolvedActions?.map(
      (sa, index) => ({
        key: index,
        label: sa.label,
        count: sa.count,
        onClick: sa.action,
        icon: buildChild(sa.icon),
      }),
    );
    return (
      <TreeViewItemView
        id={context.componentModel.id}
        expanded={props.expanded}
        current={props.current}
        containIntrinsicSize={props.containIntrinsicSize}
        onSelect={props.action}
        onExpandedChange={props.setExpanded}
        secondaryActions={secondaryActions}
      >
        {renderSlottedChildList(props.children, buildChild, context, ITEM_SLOTS)}
      </TreeViewItemView>
    );
  },
);
