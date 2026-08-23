import type {ReactNode} from 'react';
import {ActionBar as PrimerActionBar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionBarApi} from './actionbar.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: the nested DynamicString is a plain string after the binder resolves it. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: the ChildList arrives as built `children`; size/flush/gap pass through to Primer. */
type ActionBarViewProps = {
  size?: 'small' | 'medium' | 'large';
  flush?: boolean;
  gap?: 'none' | 'condensed';
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function ActionBarView({size, flush, gap, accessibility, children}: ActionBarViewProps) {
  return (
    <PrimerActionBar
      size={size}
      flush={flush}
      gap={gap}
      // Primer's A11yProps requires one of aria-label / aria-labelledby; `accessibility.label`
      // supplies the toolbar's accessible name. AccessibilityAttributes has no labelledby channel.
      aria-label={accessibility?.label ?? ''}
    >
      {children}
    </PrimerActionBar>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionBarView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild`. The built children are
 *   the real Primer ActionBar leaves, which self-register through Primer's context for overflow
 *   measurement and read `size` from the ActionBar context.
 * - `props.accessibility` carries a resolved (plain-string) label at runtime; its inferred type
 *   still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionBarComponent = createComponentImplementation(
  ActionBarApi,
  ({props, buildChild}) => (
    <ActionBarView
      size={props.size}
      flush={props.flush}
      gap={props.gap}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </ActionBarView>
  ),
);
