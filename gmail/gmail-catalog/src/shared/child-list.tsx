import {Fragment, type ReactNode} from 'react';

/** `buildChild` from the A2UI React binder: a component id, with an optional data scope, to a node. */
export type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id, or one instance of a template over a bound array. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/**
 * Renders a resolved A2UI `ChildList`: a static array resolves to ids, a `{componentId, path}`
 * template to one `{id, basePath}` per array element, each in its own data scope. Each child sits
 * in a keyed Fragment, so it stays a direct child of its container.
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
