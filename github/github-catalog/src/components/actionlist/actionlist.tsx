import type {ComponentType, ElementType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListApi} from './actionlist.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: the ChildList arrives as built `children`; the rest pass through to Primer. */
type ActionListViewProps = {
  variant?: 'inset' | 'horizontal-inset' | 'full';
  selectionVariant?: 'single' | 'radio' | 'multiple';
  showDividers?: boolean;
  role?: string;
  disableFocusZone?: boolean;
  as?: 'ul' | 'ol' | 'div';
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

/**
 * Primer ActionList is a strict polymorphic whose per-element overloads reject an `as`/`role`
 * chosen at runtime from a union. Cast it to a plain component typed with exactly the prop surface
 * we drive; the `as`/`variant`/`selectionVariant` enums are already validated by the schema.
 */
const ActionList = PrimerActionList as unknown as ComponentType<{
  as?: ElementType;
  variant?: 'inset' | 'horizontal-inset' | 'full';
  selectionVariant?: 'single' | 'radio' | 'multiple';
  showDividers?: boolean;
  role?: string;
  disableFocusZone?: boolean;
  'aria-label'?: string;
  'aria-description'?: string;
  children?: ReactNode;
}>;

export function ActionListView({
  variant,
  selectionVariant,
  showDividers,
  role,
  disableFocusZone,
  as,
  accessibility,
  children,
}: ActionListViewProps) {
  return (
    <ActionList
      as={as}
      variant={variant}
      selectionVariant={selectionVariant}
      showDividers={showDividers}
      role={role}
      disableFocusZone={disableFocusZone}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {children}
    </ActionList>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild` — the built children are
 *   the real Primer ActionList leaves, slotted by Primer's own type-based mechanism.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListComponent = createComponentImplementation(
  ActionListApi,
  ({props, buildChild}) => (
    <ActionListView
      variant={props.variant}
      selectionVariant={props.selectionVariant}
      showDividers={props.showDividers}
      role={props.role}
      disableFocusZone={props.disableFocusZone}
      as={props.as}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </ActionListView>
  ),
);
