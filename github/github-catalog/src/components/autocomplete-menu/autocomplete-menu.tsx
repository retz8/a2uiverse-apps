import {type ComponentProps, type ElementType, type ReactNode, useEffect, useState} from 'react';
import {Autocomplete as PrimerAutocomplete} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AutocompleteMenuApi} from './autocomplete-menu.schema.js';
import {iconComponent} from '../../shared/icon-component.js';

/** `buildChild` from the a2ui react binder: resolves a component id to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * A suggestion AFTER binder resolution: scalar fields plain, `leadingVisual`/`trailingVisual` are
 * plain ComponentId strings (STATIC — the binder can't identify ComponentId, so it passes the id
 * through, and the render builds it via `buildChild`). The inferred prop type still shows the raw
 * ComponentId, so `props.items` is cast to this.
 */
type ResolvedMenuItem = {
  id: string;
  text?: string;
  leadingVisual?: string;
  trailingVisual?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
};

/** The resolved `addNewItem`: an item plus a ready-to-call `action` closure (Action → () => void). */
type ResolvedAddNewItem = ResolvedMenuItem & {action?: () => void};

type PrimerMenuProps = ComponentProps<typeof PrimerAutocomplete.Menu>;
type PrimerMenuItem = PrimerMenuProps['items'][number];
type PrimerAddNewItem = NonNullable<PrimerMenuProps['addNewItem']>;

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Transcribes one resolved A2UI suggestion into Primer's `items` entry, building icon slots. */
function toPrimerItem(item: ResolvedMenuItem, buildChild: BuildChild): PrimerMenuItem {
  return {
    id: item.id,
    text: item.text,
    disabled: item.disabled,
    variant: item.variant,
    leadingVisual: item.leadingVisual
      ? (iconComponent(buildChild(item.leadingVisual)) as ElementType)
      : undefined,
    trailingVisual: item.trailingVisual
      ? (iconComponent(buildChild(item.trailingVisual)) as ElementType)
      : undefined,
  } as PrimerMenuItem;
}

/** Resolved props handed to the view; selection is owned locally and mirrored back through the setter. */
type AutocompleteMenuViewProps = {
  items: ResolvedMenuItem[];
  selectedItemIds?: string[];
  setSelectedItemIds?: (ids: string[]) => void;
  selectionVariant?: 'single' | 'multiple';
  emptyStateText?: string;
  loading?: boolean;
  addNewItem?: ResolvedAddNewItem;
  accessibility?: ResolvedAccessibility;
  buildChild: BuildChild;
};

export function AutocompleteMenuView({
  items,
  selectedItemIds,
  setSelectedItemIds,
  selectionVariant,
  emptyStateText,
  loading,
  addNewItem,
  accessibility,
  buildChild,
}: AutocompleteMenuViewProps) {
  // Primer's AutocompleteMenu reads `selectedItemIds` from the prop (it keeps no internal state) and
  // reports changes through onSelectedChange. The leaf owns the current selection, seeded from the
  // resolved prop; a guarded effect syncs an external (agent) change of the bound path into local
  // state, and each user selection writes back through `setSelectedItemIds` (a no-op when unbound).
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedItemIds ?? []);

  useEffect(() => {
    if (selectedItemIds !== undefined && !arraysEqual(selectedItemIds, selectedIds)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guarded sync of the bound value into local state, by design
      setSelectedIds(selectedItemIds);
    }
    // react only to external `selectedItemIds` changes (`selectedIds` intentionally omitted from
    // deps; react-hooks/exhaustive-deps is not enforced in the adapter package).
  }, [selectedItemIds]);

  // Primer calls onSelectedChange with the full new selection as item objects; map to their ids.
  const handleSelectedChange = (
    changed: ResolvedMenuItem | ResolvedMenuItem[] | undefined,
  ): void => {
    const list = Array.isArray(changed) ? changed : changed ? [changed] : [];
    const ids = list.filter(Boolean).map(i => i.id);
    setSelectedIds(ids);
    setSelectedItemIds?.(ids);
  };

  const primerAddNewItem: PrimerAddNewItem | undefined = addNewItem
    ? ({
        id: addNewItem.id,
        text: addNewItem.text,
        leadingVisual: addNewItem.leadingVisual
          ? (iconComponent(buildChild(addNewItem.leadingVisual)) as ElementType)
          : undefined,
        // Fired when the "create a value not in the list" row is chosen; the row's live typed value
        // is read by the agent from the input's two-way-bound path, not passed here.
        handleAddItem: () => addNewItem.action?.(),
      } as PrimerAddNewItem)
    : undefined;

  // `aria-labelledby` is the only labelling channel Primer wires onto the listbox (aria-label is not
  // forwarded), so the accessible name maps there. Typed required by Primer but optional at runtime,
  // hence the props cast.
  const menuProps = {
    items: items.map(item => toPrimerItem(item, buildChild)),
    selectedItemIds: selectedIds,
    selectionVariant,
    emptyStateText,
    loading,
    addNewItem: primerAddNewItem,
    onSelectedChange: handleSelectedChange as PrimerMenuProps['onSelectedChange'],
    'aria-labelledby': accessibility?.label,
  } as PrimerMenuProps;

  return <PrimerAutocomplete.Menu {...menuProps} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders AutocompleteMenuView.
 * - `props.items` is resolved by the binder; each entry's icon references are plain ComponentId
 *   strings the view builds via buildChild.
 * - `props.selectedItemIds` is the resolved id array (or the bound path's value); `setSelectedItemIds`
 *   is the binder's auto-generated two-way setter for the write-back.
 * - `props.addNewItem.action` resolves to a () => void closure (event vs functionCall routing is the
 *   renderer's job); it is wired to Primer's `handleAddItem`.
 * - `props.accessibility` carries the resolved label; it is cast to the resolved shape.
 * Props are passed explicitly (no spread of the resolved props): they carry extra binder setters.
 */
export const AutocompleteMenuComponent = createComponentImplementation(
  AutocompleteMenuApi,
  ({props, buildChild}) => (
    <AutocompleteMenuView
      items={props.items as unknown as ResolvedMenuItem[]}
      selectedItemIds={props.selectedItemIds as string[] | undefined}
      setSelectedItemIds={props.setSelectedItemIds}
      selectionVariant={props.selectionVariant}
      emptyStateText={props.emptyStateText}
      loading={props.loading}
      addNewItem={props.addNewItem as unknown as ResolvedAddNewItem | undefined}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
      buildChild={buildChild}
    />
  ),
);
