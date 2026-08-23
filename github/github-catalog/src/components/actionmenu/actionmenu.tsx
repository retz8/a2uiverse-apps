import {Fragment, forwardRef, type ComponentType, type ReactNode} from 'react';
import {ActionMenu as PrimerActionMenu} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {ComponentContext} from '@a2ui/web_core/v0_9';
import {ActionMenuApi} from './actionmenu.schema';

/** `buildChild` from the a2ui react binder: resolves a component id (with optional data-scope basePath) to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id string, or a `{id, basePath}` dynamic-template expansion. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/** A Primer slot component carries a `__SLOT__` marker symbol that its parent's scanner matches. */
type SlotComponent = {__SLOT__?: symbol};

/**
 * A2UI trigger leaf types Primer's `ActionMenu` finds among its direct children by slot marker
 * (`isSlot` reads `child.type.__SLOT__`) and strips out to drive its `renderAnchor`. Both carry a
 * marker: `ActionMenu.Button` (MenuButton) and `ActionMenu.Anchor`.
 */
const TRIGGER_SLOTS: Record<string, SlotComponent> = {
  'ActionMenu.Button': PrimerActionMenu.Button as unknown as SlotComponent,
  'ActionMenu.Anchor': PrimerActionMenu.Anchor as unknown as SlotComponent,
};

/**
 * Trigger bridges carry the matching slot's `__SLOT__` marker so Primer's `Menu` matches them and
 * builds its `renderAnchor` by cloning the bridge element with the anchor props it injects
 * (ref/onClick/onKeyDown/aria-*). Unlike a plain pass-through bridge, this one spreads those props
 * onto a host `<span>` and takes the injected ref — so the built trigger becomes the interactive,
 * positioned anchor (the `AnchoredOverlay` `renderAnchor` span precedent, 6.55). The binder renders
 * every child through an opaque `DeferredChild`, so the real `ActionMenu.Button`/`Anchor` element is
 * buried and never matched directly; the marked bridge is what Primer sees.
 *
 * Cached per slot component so the element type stays stable across renders (a fresh type each
 * render would remount).
 */
const triggerBridgeCache = new WeakMap<SlotComponent, ComponentType<{children?: ReactNode}>>();
function triggerBridgeFor(slot: SlotComponent): ComponentType<{children?: ReactNode}> {
  let bridge = triggerBridgeCache.get(slot);
  if (!bridge) {
    const Bridge = forwardRef<HTMLSpanElement, {children?: ReactNode}>(function TriggerBridge(
      {children, ...rest},
      ref,
    ) {
      return (
        <span ref={ref} {...rest}>
          {children}
        </span>
      );
    });
    (Bridge as SlotComponent).__SLOT__ = slot.__SLOT__;
    Bridge.displayName = 'ActionMenuTriggerBridge';
    bridge = Bridge as ComponentType<{children?: ReactNode}>;
    triggerBridgeCache.set(slot, bridge);
  }
  return bridge;
}

/**
 * Renders the root's resolved `ChildList`. A trigger child (`ActionMenu.Button`/`ActionMenu.Anchor`)
 * is wrapped in a slot-marked span bridge so Primer's `ActionMenu` recognizes it as the anchor; the
 * overlay (and any other child) renders exactly as `renderChildList` would and reads Primer's
 * `MenuContext` through the tree. A child's type is read from the surface model.
 */
export function renderActionMenuChildren(
  children: unknown,
  buildChild: BuildChild,
  context: ComponentContext,
): ReactNode {
  if (!Array.isArray(children)) return null;
  return (children as ResolvedChildRef[]).map((child, index) => {
    const id = typeof child === 'string' ? child : child.id;
    const basePath = typeof child === 'string' ? undefined : child.basePath;
    const key = `${id}-${basePath ?? index}`;
    const model = context.surfaceComponents.get(id);
    const slot = model ? TRIGGER_SLOTS[model.type] : undefined;
    if (slot) {
      const Bridge = triggerBridgeFor(slot);
      return <Bridge key={key}>{buildChild(id, basePath)}</Bridge>;
    }
    return <Fragment key={key}>{buildChild(id, basePath)}</Fragment>;
  });
}

/** Resolved props: `open` resolves to a boolean, `setOpen` is the binder's two-way setter, and the
 * `children` (trigger + overlay) arrive already slotted. */
type ActionMenuViewProps = {
  /** Controlled visibility (resolved `open`); undefined runs Primer uncontrolled. */
  open?: boolean;
  /** The binder's auto-generated two-way setter for the bound `open`; wired as Primer's onOpenChange. */
  setOpen?: (open: boolean) => void;
  children?: ReactNode;
};

/**
 * Primer's `ActionMenu` narrows `children` to `ReactElement | ReactElement[]`; the slotted children
 * arrive as a general `ReactNode` (span bridges + Fragments). Cast to a plain component typed with
 * exactly the surface we drive.
 */
const Menu = PrimerActionMenu as unknown as (props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}) => ReactNode;

export function ActionMenuView({open, setOpen, children}: ActionMenuViewProps) {
  // Primer's ActionMenu is controlled only when BOTH `open` and `onOpenChange` are supplied;
  // otherwise it runs uncontrolled with its own internal open state. When `open` is provided (literal
  // or bound), wire the binder's `setOpen` as `onOpenChange` so the trigger's open/close gestures
  // write the new value back (a no-op for an unbound literal). When `open` is omitted, pass neither
  // so Primer manages visibility itself.
  const controlled = open !== undefined;
  return (
    <Menu open={controlled ? open : undefined} onOpenChange={controlled ? setOpen : undefined}>
      {children}
    </Menu>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionMenuView. It wraps Primer's
 * self-contained `ActionMenu`, which portals the menu to the body and manages its own focus trap /
 * Escape / outside-click / roving focus.
 * - `props.children` is a resolved `ChildList` (the trigger + overlay); `renderActionMenuChildren`
 *   slots the trigger via a marked span bridge and renders the overlay normally.
 * - `props.open` is the resolved boolean; `props.setOpen` is the binder's auto-generated two-way
 *   setter (GenerateSetters, from the DynamicBoolean prop), wired as Primer's `onOpenChange`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionMenuComponent = createComponentImplementation(
  ActionMenuApi,
  ({props, buildChild, context}) => (
    <ActionMenuView open={props.open} setOpen={props.setOpen}>
      {renderActionMenuChildren(props.children, buildChild, context)}
    </ActionMenuView>
  ),
);
