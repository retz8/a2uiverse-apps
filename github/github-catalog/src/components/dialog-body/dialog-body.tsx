import type {ReactNode} from 'react';
import {Dialog as PrimerDialog} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogBodyApi} from './dialog-body.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children` (the dialog's body content). */
type DialogBodyViewProps = {children?: ReactNode};

export function DialogBodyView({children}: DialogBodyViewProps) {
  return <PrimerDialog.Body>{children}</PrimerDialog.Body>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogBodyView.
 * - `props.children` (a resolved `ChildList`) is built via `renderChildList` — the body content;
 *   the root's slot scanner routes this leaf into Primer's body slot.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogBodyComponent = createComponentImplementation(
  DialogBodyApi,
  ({props, buildChild}) => (
    <DialogBodyView>{renderChildList(props.children, buildChild)}</DialogBodyView>
  ),
);
