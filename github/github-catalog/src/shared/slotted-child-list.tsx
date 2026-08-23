import {Fragment, type ComponentType, type ReactNode} from 'react';
import type {ComponentContext} from '@a2ui/web_core/v0_9';
import {renderChildList} from './child-list';

/** `buildChild` from the a2ui react binder: resolves a component id (with optional data-scope basePath) to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id string, or a `{id, basePath}` dynamic-template expansion. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/** A Primer slot component carries a `__SLOT__` marker symbol that its parent's `useSlots` matches. */
type SlotComponent = {__SLOT__?: symbol};

/**
 * How to route one child type into its Primer slot. Primer detects slots by inspecting each **direct**
 * child's element type / `__SLOT__` marker (`useSlots`) — but the binder renders every child through an
 * opaque `DeferredChild` wrapper, so the real slot element is buried and never matched. These modes
 * present a directly-matchable element to the parent while preserving the leaf's own binder rendering:
 *
 * - `bridge` — for slots Primer matches by `__SLOT__` marker (`LeadingVisual`, `TrailingVisual`,
 *   `Description`, `TrailingAction`). The child renders as today via `buildChild`, wrapped in a
 *   pass-through whose type carries the same marker, so `useSlots` routes it. `forward` copies the
 *   element-level props Primer reads off the matched element (`Description.variant`,
 *   `TrailingAction.loading`) up from the raw model onto the wrapper.
 * - `wrapChildren` — for slots Primer matches by **reference identity only** (`NavList.SubNav` carries
 *   no marker). A marker bridge can't satisfy it, so the real Primer component is rendered directly,
 *   wrapping the leaf's own children (built via `buildChild`).
 * - `wrapChild` — like `wrapChildren`, for reference-matched slots (`TreeView.LeadingVisual` /
 *   `TrailingVisual` carry no marker), but the leaf holds a single icon under a `ComponentId` prop
 *   (`child`) plus element-level props Primer reads off the matched element (`label`). The real Primer
 *   component is rendered directly with `forward`ed props copied from the raw model and its one built
 *   child inside.
 */
export type SlotSpec =
  | {mode: 'bridge'; slot: SlotComponent; forward?: readonly string[]}
  | {mode: 'wrapChildren'; component: ComponentType<{children?: ReactNode}>}
  | {
      mode: 'wrapChild';
      component: ComponentType<{children?: ReactNode; [prop: string]: unknown}>;
      /** Model property holding the single child `ComponentId` to build (default `'child'`). */
      childProp?: string;
      /** Element-level props Primer reads off the matched element (e.g. `label`), copied from the model. */
      forward?: readonly string[];
    };

/** Maps an A2UI component type name (e.g. `'NavList.LeadingVisual'`) to how it slots into its parent. */
export type SlotMap = Record<string, SlotSpec>;

/**
 * Pass-through components carry the parent slot's `__SLOT__` marker so `useSlots` matches them; cached
 * per slot component so the element type stays stable across renders (a fresh type each render would
 * remount). The wrapper renders its children verbatim and forwards no props to them — the marker and
 * any `forward`ed props live on the element, which is all the parent scanner reads.
 */
const bridgeCache = new WeakMap<SlotComponent, ComponentType<{children?: ReactNode}>>();
function bridgeFor(slot: SlotComponent): ComponentType<{children?: ReactNode}> {
  let bridge = bridgeCache.get(slot);
  if (!bridge) {
    const Bridge = ({children}: {children?: ReactNode}) => children as ReactNode;
    (Bridge as SlotComponent).__SLOT__ = slot.__SLOT__;
    Bridge.displayName = 'SlotBridge';
    bridge = Bridge;
    bridgeCache.set(slot, bridge);
  }
  return bridge;
}

/**
 * Renders a resolved A2UI `ChildList` for a slot-bearing Primer parent (`NavList.Item`, `NavList.Group`,
 * …). Children whose component type appears in `slotMap` are routed into the matching Primer slot (see
 * `SlotSpec`); every other child renders exactly as `renderChildList` would, becoming the parent's main
 * content. A child's type is read from the surface model via `context.surfaceComponents`.
 */
export function renderSlottedChildList(
  children: unknown,
  buildChild: BuildChild,
  context: ComponentContext,
  slotMap: SlotMap,
): ReactNode {
  if (!Array.isArray(children)) return null;
  return (children as ResolvedChildRef[]).map((child, index) => {
    const id = typeof child === 'string' ? child : child.id;
    const basePath = typeof child === 'string' ? undefined : child.basePath;
    const key = `${id}-${basePath ?? index}`;
    const model = context.surfaceComponents.get(id);
    const spec = model ? slotMap[model.type] : undefined;

    if (!spec) {
      return <Fragment key={key}>{buildChild(id, basePath)}</Fragment>;
    }

    if (spec.mode === 'wrapChildren') {
      const Slot = spec.component;
      return <Slot key={key}>{renderChildList(model?.properties?.children, buildChild)}</Slot>;
    }

    if (spec.mode === 'wrapChild') {
      const Slot = spec.component;
      const childRef = model?.properties?.[spec.childProp ?? 'child'] as
        ResolvedChildRef | undefined;
      const childId = typeof childRef === 'string' ? childRef : childRef?.id;
      const childBase = typeof childRef === 'string' ? undefined : childRef?.basePath;
      return (
        <Slot key={key} {...forwardedProps(spec.forward, model)}>
          {childId ? buildChild(childId, childBase) : null}
        </Slot>
      );
    }

    const Bridge = bridgeFor(spec.slot);
    return (
      <Bridge key={key} {...forwardedProps(spec.forward, model)}>
        {buildChild(id, basePath)}
      </Bridge>
    );
  });
}

/** Copies the named element-level props Primer reads off a matched slot element up from the raw model. */
function forwardedProps(
  forward: readonly string[] | undefined,
  model: {properties?: Record<string, unknown>} | undefined,
): Record<string, unknown> {
  const forwarded: Record<string, unknown> = {};
  if (forward) {
    const props = model?.properties ?? {};
    for (const name of forward) {
      if (name in props) forwarded[name] = props[name];
    }
  }
  return forwarded;
}
