/**
 * Primer's `PageHeader` derives root data attributes — the title size and the navigation
 * presence/visibility — by inspecting its *direct* React children for `TitleArea` and
 * `Navigation`. Through the A2UI renderer a region's direct child is a wrapper element, so that
 * hoist finds nothing: the title inherits body size and a bordered header draws its own bottom
 * border on top of the navigation's. Each leaf stamps its share of those attributes on the root
 * itself, mirroring Primer's `getResponsiveAttributes` / `getHiddenDataAttributes`. Primer never
 * sets them in this tree, so React leaves the stamped attributes alone across re-renders.
 */
import {useLayoutEffect} from 'react';
import type {RefObject} from 'react';

export type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

const BREAKPOINTS = ['narrow', 'regular', 'wide'] as const;
const ROOT_SELECTOR = '[data-component="PageHeader"]';

type Attributes = Record<string, string | undefined>;

/** `data-<property>` for a scalar, `data-<property>-<breakpoint>` per key for a responsive map. */
export function responsiveAttributes(property: string, value: Responsive<string>): Attributes {
  if (typeof value === 'object') {
    const out: Attributes = {};
    for (const b of BREAKPOINTS)
      if (value[b] !== undefined) out[`data-${property}-${b}`] = value[b];
    return out;
  }
  return {[`data-${property}`]: value};
}

/** Primer's hidden scheme: `-all` when uniform, else per breakpoint (wide folded into regular when equal). */
export function hiddenAttributes(
  prefix: string,
  hidden: Responsive<boolean> | undefined,
): Attributes {
  const flag = (v: boolean | undefined) => (v ? 'true' : undefined);
  if (hidden === undefined || typeof hidden !== 'object')
    return {[`data-${prefix}-all`]: flag(hidden)};
  const {narrow, regular, wide} = hidden;
  if (narrow === regular && regular === wide) return {[`data-${prefix}-all`]: flag(narrow)};
  const out: Attributes = {};
  if ('narrow' in hidden) out[`data-${prefix}-narrow`] = flag(narrow);
  if ('regular' in hidden) out[`data-${prefix}-regular`] = flag(regular);
  if ('wide' in hidden && regular !== wide) out[`data-${prefix}-wide`] = flag(wide);
  return out;
}

/** Every attribute name a leaf may own for `property`, so a re-render clears stale ones. */
export function ownedAttributeNames(...properties: string[]): string[] {
  return properties.flatMap(p => [
    `data-${p}`,
    `data-${p}-all`,
    ...BREAKPOINTS.map(b => `data-${p}-${b}`),
  ]);
}

/** Stamp `attributes` on the enclosing PageHeader root, clearing `owned` first. */
export function usePageHeaderRootAttributes(
  ref: RefObject<HTMLElement | null>,
  owned: string[],
  attributes: Attributes,
  deps: unknown[],
): void {
  useLayoutEffect(() => {
    const root = ref.current?.closest(ROOT_SELECTOR);
    if (!root) return;
    for (const name of owned) root.removeAttribute(name);
    for (const [name, value] of Object.entries(attributes)) {
      if (value !== undefined) root.setAttribute(name, value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller names the inputs
  }, deps);
}
