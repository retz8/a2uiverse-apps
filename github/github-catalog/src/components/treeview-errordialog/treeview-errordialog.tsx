import type {ReactNode} from 'react';
import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewErrorDialogApi} from './treeview-errordialog.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: ChildList arrives as built `children`; `title` passes through; the two Actions
 * resolve to () => void closures wired to Primer's onRetry/onDismiss. */
type TreeViewErrorDialogViewProps = {
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  children?: ReactNode;
};

export function TreeViewErrorDialogView({
  title,
  onRetry,
  onDismiss,
  children,
}: TreeViewErrorDialogViewProps) {
  return (
    <PrimerTreeView.ErrorDialog title={title} onRetry={onRetry} onDismiss={onDismiss}>
      {children}
    </PrimerTreeView.ErrorDialog>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TreeViewErrorDialogView. It wraps
 * Primer's self-contained `ConfirmationDialog`, which portals and manages its own backdrop/focus.
 * - `props.children` (required ChildList) is built via `renderChildList` — the dialog body.
 * - `props.retryAction`/`props.dismissAction` resolve to () => void closures -> onRetry/onDismiss
 *   (the renderer routes event vs functionCall).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TreeViewErrorDialogComponent = createComponentImplementation(
  TreeViewErrorDialogApi,
  ({props, buildChild}) => (
    <TreeViewErrorDialogView
      title={props.title}
      onRetry={props.retryAction}
      onDismiss={props.dismissAction}
    >
      {renderChildList(props.children, buildChild)}
    </TreeViewErrorDialogView>
  ),
);
