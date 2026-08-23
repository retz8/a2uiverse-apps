import {useMemo, type ReactNode} from 'react';
import {AvatarStack as PrimerAvatarStack} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AvatarStackApi} from './avatarstack.schema';
import {AvatarStackItemContext} from '../../shared/avatar-stack-context';

/** `buildChild` from the a2ui react binder: resolves a component id (with optional data-scope basePath) to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id string, or a `{id, basePath}` dynamic-template expansion. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/** A resolved `size`: either a scalar pixel value or Primer's `{narrow, regular, wide}` responsive map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/**
 * Bridge between Primer's child-injection and the binder's opaque child. Primer's `AvatarStack`
 * clones its overlap class (`AvatarItem`) and the `square` flag (from stack `shape`) onto each
 * *direct* child via `cloneElement`; the binder's `DeferredChild` (what `buildChild` returns) drops
 * any injected React prop, so it never reaches the real avatar. `AvatarStackItem` is a real element
 * Primer can inject into, and it re-broadcasts the injection through React context — which flows
 * through the opaque wrapper — so the `Avatar` behind it applies the class/flag onto its `<img>`.
 * It renders no DOM of its own, so the avatar stays a direct flex child of the stack body and the
 * `:nth-child(n+2)` overlap rule (and the `--avatar-stack-size` sizing the class carries) apply.
 */
function AvatarStackItem({
  className,
  square,
  children,
}: {
  className?: string;
  square?: boolean;
  children?: ReactNode;
}) {
  const injection = useMemo(() => ({className, square}), [className, square]);
  return (
    <AvatarStackItemContext.Provider value={injection}>{children}</AvatarStackItemContext.Provider>
  );
}

/**
 * Renders a resolved A2UI `ChildList` as AvatarStack items. Each built child is wrapped in an
 * `AvatarStackItem` bridge (see its note) rather than the shared `renderChildList` Fragment, so
 * Primer's injected overlap/size/square styling reaches the real avatar behind the binder's
 * opaque child.
 */
function renderAvatarItems(children: unknown, buildChild: BuildChild): ReactNode {
  if (!Array.isArray(children)) return null;
  return (children as ResolvedChildRef[]).map((child, index) => {
    const isStatic = typeof child === 'string';
    const key = isStatic ? `${child}-${index}` : `${child.id}-${child.basePath ?? index}`;
    const node = isStatic ? buildChild(child) : buildChild(child.id, child.basePath);
    return <AvatarStackItem key={key}>{node}</AvatarStackItem>;
  });
}

/** Resolved props: ChildList arrives as built `children`; `size` passes through (scalar or map). */
type AvatarStackViewProps = {
  alignRight?: boolean;
  disableExpand?: boolean;
  variant?: 'cascade' | 'stack';
  shape?: 'circle' | 'square';
  size?: Responsive<number>;
  children?: ReactNode;
};

export function AvatarStackView({
  alignRight,
  disableExpand,
  variant,
  shape,
  size,
  children,
}: AvatarStackViewProps) {
  return (
    <PrimerAvatarStack
      alignRight={alignRight}
      disableExpand={disableExpand}
      variant={variant}
      shape={shape}
      size={size}
    >
      {children}
    </PrimerAvatarStack>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders AvatarStackView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderAvatarItems` builds each via `buildChild` inside an
 *   `AvatarStackItem` bridge so Primer's injected overlap/size/square styling reaches the avatars.
 * - `size` resolves as a STATIC pass-through (scalar or responsive map) — forwarded to Primer,
 *   which handles the CSS. There is no ComponentId/Action row beyond `children`, so no `onClick`.
 *   Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const AvatarStackComponent = createComponentImplementation(
  AvatarStackApi,
  ({props, buildChild}) => (
    <AvatarStackView
      alignRight={props.alignRight}
      disableExpand={props.disableExpand}
      variant={props.variant}
      shape={props.shape}
      size={props.size}
    >
      {renderAvatarItems(props.children, buildChild)}
    </AvatarStackView>
  ),
);
