import {Fragment, type ReactNode} from 'react';

/** `buildChild` from the a2ui react binder: resolves a component id (with optional data-scope basePath) to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id string, or a `{id, basePath}` dynamic-template expansion. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/**
 * Renders a resolved A2UI `ChildList`. The generic binder resolves a static array to a `string[]`
 * of ids and a dynamic `{componentId, path}` template to a `{id, basePath}[]` expansion (one entry
 * per bound array item, each with its own data scope); this handles both forms. Each child is
 * wrapped in a keyed Fragment (no DOM) so it stays a direct flex child of the container.
 */
export function renderChildList(children: unknown, buildChild: BuildChild): ReactNode {
  if (!Array.isArray(children)) return null;
  return (children as ResolvedChildRef[]).map((child, index) =>
    typeof child === 'string' ? (
      <Fragment key={`${child}-${index}`}>{buildChild(child)}</Fragment>
    ) : (
      <Fragment key={`${child.id}-${child.basePath ?? index}`}>
        {buildChild(child.id, child.basePath)}
      </Fragment>
    ),
  );
}

/**
 * The component id a resolved `ChildList` entry stands for. The renderer hands a component its
 * children as their nodes' own ids, which name no component on the surface, so a parent that
 * routes a child by its type reads the id from the list its model holds: a static list's entry at
 * the same position, or a template's component id for every instance.
 */
export function childComponentId(list: unknown, index: number): string | undefined {
  if (Array.isArray(list)) return typeof list[index] === 'string' ? list[index] : undefined;
  const template = list as {componentId?: unknown} | undefined;
  return typeof template?.componentId === 'string' ? template.componentId : undefined;
}
