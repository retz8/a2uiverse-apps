import {Fragment, type ReactNode} from 'react';

/** `buildChild` from the binder: resolves a component id (with a template item's base path) to a node. */
type BuildChild = (id: string, basePath?: string) => ReactNode;

/** A resolved `ChildList` entry: a static id, or one `{id, basePath}` per item of a bound array. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/**
 * Renders a resolved A2UI `ChildList`, static or templated. A template's items keep their own
 * data scope through `basePath`, which is also what makes each item's root findable from its
 * data path. Each child sits in a keyed Fragment, so it stays a direct child of its container.
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
