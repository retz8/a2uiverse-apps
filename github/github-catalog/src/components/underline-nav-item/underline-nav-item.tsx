import type {ComponentType, ReactElement, ReactNode} from 'react';
import {UnderlineNav as PrimerUnderlineNav} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {UnderlineNavItemApi} from './underline-nav-item.schema';

type AriaCurrent = 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';

/**
 * Primer UnderlineNav.Item is a strict polymorphic (default element `'a'`) whose per-element
 * overloads reject the exact prop union we drive. Cast it to a plain component typed with the prop
 * surface we render; the `aria-current` enum is already validated by the schema.
 */
const Item = PrimerUnderlineNav.Item as unknown as ComponentType<{
  href?: string;
  'aria-current'?: AriaCurrent;
  counter?: number | string;
  leadingVisual?: ReactElement;
  onSelect?: () => void;
  children?: ReactNode;
}>;

/** Resolved props: Dynamic* resolve to primitives; the ComponentId leadingVisual -> a built child; `action` -> onSelect. */
type UnderlineNavItemViewProps = {
  text?: string;
  href?: string;
  ariaCurrent?: AriaCurrent;
  counter?: string; // Primer accepts number | string; the binder only ever resolves DynamicString to a string here.
  leadingVisual?: ReactNode;
  onSelect?: () => void;
};

export function UnderlineNavItemView({
  text,
  href,
  ariaCurrent,
  counter,
  leadingVisual,
  onSelect,
}: UnderlineNavItemViewProps) {
  return (
    <Item
      href={href}
      aria-current={ariaCurrent}
      counter={counter}
      leadingVisual={leadingVisual as ReactElement | undefined}
      onSelect={onSelect}
    >
      {text ?? ''}
    </Item>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders UnderlineNavItemView.
 * - `props.text` is the resolved label (Primer's raw-text `children`); `props.leadingVisual`
 *   (optional) is built via `buildChild` into Primer's element slot.
 * - `props.action` is the resolved `() => void` wired to Primer's `onSelect` (fired on click and
 *   keyboard); event vs functionCall routing is the renderer's job. No optimistic setter — the
 *   item carries no bound selection state (the `select` event's `context` is static).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const UnderlineNavItemComponent = createComponentImplementation(
  UnderlineNavItemApi,
  ({props, buildChild}) => (
    <UnderlineNavItemView
      text={props.text}
      href={props.href}
      ariaCurrent={props['aria-current']}
      counter={props.counter}
      leadingVisual={props.leadingVisual ? buildChild(props.leadingVisual) : undefined}
      onSelect={props.action}
    />
  ),
);
