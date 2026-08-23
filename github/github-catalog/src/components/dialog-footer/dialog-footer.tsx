import type {ReactNode} from 'react';
import {Dialog as PrimerDialog} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogFooterApi} from './dialog-footer.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children` (the DialogButtons row). */
type DialogFooterViewProps = {children?: ReactNode};

export function DialogFooterView({children}: DialogFooterViewProps) {
  return <PrimerDialog.Footer>{children}</PrimerDialog.Footer>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogFooterView.
 * - `props.children` (a resolved `ChildList`) is built via `renderChildList` — the footer content;
 *   the root's slot scanner routes this leaf into Primer's footer slot.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogFooterComponent = createComponentImplementation(
  DialogFooterApi,
  ({props, buildChild}) => (
    <DialogFooterView>{renderChildList(props.children, buildChild)}</DialogFooterView>
  ),
);
