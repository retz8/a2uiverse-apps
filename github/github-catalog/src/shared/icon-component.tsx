import {Fragment, type FC, type ReactNode} from 'react';

/**
 * Wraps an already-built A2UI child node as a zero-prop component. Primer renders icon slots as
 * `<Icon/>` — a component invoked via `createElement`, not a node embedded directly. Most paths
 * tolerate a built element (Primer's ButtonBase has an `isElement` branch), but some invoke the
 * icon strictly as a component type: ActionBar's overflow menu rebuilds each collapsed item with
 * `createElement(icon)`, which throws (React #130, "got: object") on a built element. Adapting the
 * node to a component satisfies both call shapes.
 */
export function iconComponent(node: ReactNode): FC {
  const Wrapped: FC = () => <Fragment>{node}</Fragment>;
  return Wrapped;
}
