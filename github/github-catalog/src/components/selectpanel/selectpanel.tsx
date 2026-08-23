import {type ComponentType, type ElementType, type ReactNode, useEffect, useState} from 'react';
import {SelectPanel as PrimerSelectPanel} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {ComponentContext} from '@a2ui/web_core/v0_9';
import {SelectPanelApi} from './selectpanel.schema';
import {iconComponent} from '../../shared/icon-component';

/** `buildChild` from the a2ui react binder: resolves a component id (with optional scope) to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id string, or a `{id, basePath}` dynamic-template expansion. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/** The Primer `ItemInput` fields the SelectPanel render fn produces from each `SelectPanel.Item`. */
export type SelectPanelItemInput = {
  id: string;
  text: string;
  description?: string;
  descriptionVariant?: 'inline' | 'block';
  leadingVisual?: ElementType;
  trailingVisual?: ElementType;
  variant?: 'default' | 'danger';
  selected?: boolean;
  disabled?: boolean;
};

/** Resolved item + the wiring needed to react to its selection (bound path + optional side-effect). */
type ItemDescriptor = {
  input: SelectPanelItemInput;
  /** Absolute data-model path to write on selection change (when `selected` is a `{path}` binding). */
  selectedPath?: string;
  /** The raw `action` to dispatch (functionCall/event) when this item is selected. */
  action?: unknown;
};

type ResolvedAccessibility = {label?: string; description?: string};
type ResolvedNotice = {text: string; variant: 'info' | 'warning' | 'error'};
type ResolvedMessage = {title: string; body: string; variant: 'empty' | 'error' | 'warning'};

/**
 * Primer's `SelectPanel` is a strict intersection with a single/multi-selection union that rejects
 * a `selectionVariant` chosen at runtime. Cast it to a plain component typed with exactly the prop
 * surface the View drives; the enums are already validated by the schema.
 */
const Panel = PrimerSelectPanel as unknown as ComponentType<{
  open: boolean;
  onOpenChange: (open: boolean, gesture?: string) => void;
  renderAnchor: (anchorProps: Record<string, unknown>) => ReactNode;
  items: SelectPanelItemInput[];
  selected: SelectPanelItemInput | SelectPanelItemInput[] | undefined;
  onSelectedChange: (selected: SelectPanelItemInput | SelectPanelItemInput[] | undefined) => void;
  onAction?: (item: SelectPanelItemInput, event: unknown) => void;
  title?: string;
  subtitle?: string;
  filterValue?: string;
  onFilterChange?: (value: string, e?: unknown) => void;
  placeholderText?: string;
  inputLabel?: string;
  variant?: 'anchored' | 'modal';
  onCancel?: () => void;
  secondaryAction?: ReactNode;
  notice?: ResolvedNotice;
  message?: ResolvedMessage;
  loading?: boolean;
  showSelectedOptionsFirst?: boolean;
  showSelectAll?: boolean;
  align?: 'start' | 'center' | 'end';
  height?: string;
  width?: string;
  displayInViewport?: boolean;
  showItemDividers?: boolean;
  virtualized?: boolean;
  focusOutBehavior?: 'stop' | 'wrap';
  disableFullscreenOnNarrow?: boolean;
  'aria-label'?: string;
  'aria-description'?: string;
}>;

/**
 * Resolved props: the anchor and secondary-action are built nodes; `items` are already in Primer's
 * `ItemInput` shape (with their seeded `selected`). The View owns local open + selection state (the
 * AnchoredOverlay precedent — Primer's SelectPanel is controlled). Selection side-effects (the bound
 * write-back and the item's `action`) are delegated to `onItemAction`, which the catalog entry
 * closes over the component context.
 */
export type SelectPanelViewProps = {
  anchor: ReactNode;
  items: SelectPanelItemInput[];
  selectionVariant?: 'single' | 'multiple';
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onOpenChange?: () => void;
  onCancel?: () => void;
  /** Fired when an item is selected: `(itemId, nowSelected)` — the impl writes the bound path and dispatches the item's action. */
  onItemAction?: (itemId: string, nowSelected: boolean) => void;
  title?: string;
  subtitle?: string;
  filterValue?: string;
  setFilterValue?: (value: string) => void;
  placeholderText?: string;
  inputLabel?: string;
  variant?: 'anchored' | 'modal';
  secondaryAction?: ReactNode;
  notice?: ResolvedNotice;
  message?: ResolvedMessage;
  loading?: boolean;
  showSelectedOptionsFirst?: boolean;
  showSelectAll?: boolean;
  align?: 'start' | 'center' | 'end';
  height?: string;
  width?: string;
  displayInViewport?: boolean;
  showItemDividers?: boolean;
  virtualized?: boolean;
  focusOutBehavior?: 'stop' | 'wrap';
  disableFullscreenOnNarrow?: boolean;
  accessibility?: ResolvedAccessibility;
};

export function SelectPanelView({
  anchor,
  items,
  selectionVariant,
  open,
  setOpen,
  onOpenChange,
  onCancel,
  onItemAction,
  title,
  subtitle,
  filterValue,
  setFilterValue,
  placeholderText,
  inputLabel,
  variant,
  secondaryAction,
  notice,
  message,
  loading,
  showSelectedOptionsFirst,
  showSelectAll,
  align,
  height,
  width,
  displayInViewport,
  showItemDividers,
  virtualized,
  focusOutBehavior,
  disableFullscreenOnNarrow,
  accessibility,
}: SelectPanelViewProps) {
  const isMultiple = selectionVariant === 'multiple';

  // Local visibility, seeded from the controlled `open`; one guarded effect syncs an external change.
  const [isOpen, setIsOpen] = useState(open ?? false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- guarded sync of the bound value into local state, by design
    if (open !== undefined && open !== isOpen) setIsOpen(open);
  }, [open]);

  // Local selection, seeded once from each item's `selected`. The per-item `selected` handed to
  // Primer is driven from it, so the panel reflects the current selection.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(items.filter(i => i.selected).map(i => i.id)),
  );

  const renderedItems = items.map(i => ({...i, selected: selectedIds.has(i.id)}));
  const selectedItems = renderedItems.filter(i => selectedIds.has(i.id));
  const selected = isMultiple ? selectedItems : selectedItems[0];

  // A controlled `filterValue` delegates filtering to us (Primer does not filter a controlled
  // list): show only the items whose label contains the filter text (case-insensitive substring),
  // the local client-side filter the decision doc specifies (no agent round-trip).
  const needle = filterValue?.trim().toLowerCase() ?? '';
  const shownItems = needle
    ? renderedItems.filter(i => i.text.toLowerCase().includes(needle))
    : renderedItems;

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    setOpen?.(next);
    onOpenChange?.();
  };

  // Primer reports the aggregate selection on every click/keyboard select (it owns no top-level
  // per-item onAction). Diff it against the current selection to find the toggled items, update
  // local state (checkmarks follow), and fire the per-item side-effect (bound write-back + action)
  // for each — new selection first, so an event action's `context` carries the fresh value.
  const handleSelectedChange = (
    next: SelectPanelItemInput | SelectPanelItemInput[] | undefined,
  ) => {
    const arr = Array.isArray(next) ? next : next ? [next] : [];
    const nextIds = new Set(arr.map(i => i.id));
    const changed = new Set<string>();
    for (const id of nextIds) if (!selectedIds.has(id)) changed.add(id);
    for (const id of selectedIds) if (!nextIds.has(id)) changed.add(id);
    setSelectedIds(nextIds);
    for (const id of changed) onItemAction?.(id, nextIds.has(id));
  };

  return (
    <Panel
      open={isOpen}
      onOpenChange={handleOpenChange}
      renderAnchor={anchorProps => <span {...anchorProps}>{anchor}</span>}
      items={shownItems}
      selected={selected}
      onSelectedChange={handleSelectedChange}
      title={title}
      subtitle={subtitle}
      filterValue={filterValue}
      onFilterChange={value => setFilterValue?.(value)}
      placeholderText={placeholderText}
      inputLabel={inputLabel}
      variant={variant}
      onCancel={() => onCancel?.()}
      secondaryAction={secondaryAction}
      notice={notice}
      message={message}
      loading={loading}
      showSelectedOptionsFirst={showSelectedOptionsFirst}
      showSelectAll={showSelectAll}
      align={align}
      height={height}
      width={width}
      displayInViewport={displayInViewport}
      showItemDividers={showItemDividers}
      virtualized={virtualized}
      focusOutBehavior={focusOutBehavior}
      disableFullscreenOnNarrow={disableFullscreenOnNarrow}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    />
  );
}

/** Resolves a `ComponentId` visual to a Primer `ElementType` (a built node wrapped as a component). */
function resolveVisual(id: unknown, buildChild: BuildChild): ElementType | undefined {
  return typeof id === 'string' ? iconComponent(buildChild(id)) : undefined;
}

/**
 * Reads each `SelectPanel.Item` child's resolved props off the surface model and maps it to one
 * Primer `ItemInput`. The item leaf never renders standalone (`SelectPanel.Item` is a data-carrier),
 * so its props are resolved here against a data context scoped to the child's position (so a
 * dynamic-template item's relative `{path:'./name'}` resolves per row).
 */
function resolveItems(
  children: unknown,
  context: ComponentContext,
  buildChild: BuildChild,
): ItemDescriptor[] {
  if (!Array.isArray(children)) return [];
  return (children as ResolvedChildRef[]).flatMap(child => {
    const childId = typeof child === 'string' ? child : child.id;
    const basePath = typeof child === 'string' ? undefined : child.basePath;
    const model = context.surfaceComponents.get(childId);
    if (!model) return [];
    const props = model.properties ?? {};
    const dc = basePath ? context.dataContext.nested(basePath) : context.dataContext;
    // A dynamic-template expands one component id across many rows; disambiguate the item identity
    // by the row's data scope so Primer does not collapse the rows into one.
    const rowId = basePath ? `${childId}@${basePath}` : childId;
    const resolve = <V,>(raw: unknown): V | undefined =>
      raw === undefined ? undefined : dc.resolveDynamicValue<V>(raw as never);

    const selectedRaw = props.selected;
    const selectedPath =
      selectedRaw && typeof selectedRaw === 'object' && 'path' in (selectedRaw as object)
        ? dc.nested((selectedRaw as {path: string}).path).path
        : undefined;

    const input: SelectPanelItemInput = {
      id: rowId,
      text: resolve<string>(props.text) ?? '',
      description: resolve<string>(props.description),
      descriptionVariant: props.descriptionVariant as 'inline' | 'block' | undefined,
      leadingVisual: resolveVisual(props.leadingVisual, buildChild),
      trailingVisual: resolveVisual(props.trailingVisual, buildChild),
      variant: props.variant as 'default' | 'danger' | undefined,
      selected: resolve<boolean>(selectedRaw) ?? false,
      disabled: resolve<boolean>(props.disabled),
    };
    return [{input, selectedPath, action: props.action}];
  });
}

/**
 * Catalog entry: the generic binder resolves the panel's own props, then this fn reads the
 * `SelectPanel.Item` children off the surface model as `items` data and renders SelectPanelView.
 * - `props.anchor` is a resolved `ComponentId`, built and handed to Primer's `renderAnchor`.
 * - `props.open`/`props.setOpen` are the resolved boolean + the binder's two-way setter (the
 *   AnchoredOverlay precedent); `props.filterValue`/`props.setFilterValue` likewise for the filter.
 * - `onItemAction` performs the item's optimistic selection write-back (`dataContext.set` on the
 *   item's bound path) BEFORE dispatching its `action` (so an event's `context` carries the new
 *   selection), the ActionList.Item precedent.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SelectPanelComponent = createComponentImplementation(
  SelectPanelApi,
  ({props, buildChild, context}) => {
    const descriptors = resolveItems(props.children, context, buildChild);
    const byId = new Map(descriptors.map(d => [d.input.id, d]));

    const onItemAction = (itemId: string, nowSelected: boolean) => {
      const d = byId.get(itemId);
      if (!d) return;
      // Optimistic selection write-back first, so an event action's `context` carries the new value.
      if (d.selectedPath) context.dataContext.set(d.selectedPath, nowSelected);
      // Route the item's action by shape: a functionCall runs locally through the invoker
      // (`resolveAction` evaluates it), an event dispatches to the injected handler.
      const action = d.action as {event?: unknown; functionCall?: unknown} | undefined;
      if (!action) return;
      if ('event' in action) void context.dispatchAction(action);
      else context.dataContext.resolveAction(action as never);
    };

    return (
      <SelectPanelView
        anchor={buildChild(props.anchor)}
        items={descriptors.map(d => d.input)}
        selectionVariant={props.selectionVariant}
        open={props.open}
        setOpen={(props as {setOpen?: (v: boolean) => void}).setOpen}
        onOpenChange={props.onOpenChange}
        onCancel={props.onCancel}
        onItemAction={onItemAction}
        title={props.title}
        subtitle={props.subtitle}
        filterValue={props.filterValue}
        setFilterValue={(props as {setFilterValue?: (v: string) => void}).setFilterValue}
        placeholderText={props.placeholderText}
        inputLabel={props.inputLabel}
        variant={props.variant}
        secondaryAction={props.secondaryAction ? buildChild(props.secondaryAction) : undefined}
        notice={props.notice as ResolvedNotice | undefined}
        message={props.message as ResolvedMessage | undefined}
        loading={props.loading}
        showSelectedOptionsFirst={props.showSelectedOptionsFirst}
        showSelectAll={props.showSelectAll}
        align={props.align}
        height={props.height}
        width={props.width}
        displayInViewport={props.displayInViewport}
        showItemDividers={props.showItemDividers}
        virtualized={props.virtualized}
        focusOutBehavior={props.focusOutBehavior}
        disableFullscreenOnNarrow={props.disableFullscreenOnNarrow}
        accessibility={props.accessibility as ResolvedAccessibility | undefined}
      />
    );
  },
);
