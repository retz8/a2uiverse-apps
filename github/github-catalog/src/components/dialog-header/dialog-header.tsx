import type {ReactNode} from 'react';
import {Dialog as PrimerDialog} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DialogHeaderApi} from './dialog-header.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children` (DialogTitle/Subtitle/CloseButton). */
type DialogHeaderViewProps = {children?: ReactNode};

export function DialogHeaderView({children}: DialogHeaderViewProps) {
  return <PrimerDialog.Header>{children}</PrimerDialog.Header>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders DialogHeaderView.
 * - `props.children` (a resolved `ChildList`) is built via `renderChildList` — the header content;
 *   the root's slot scanner routes this leaf into Primer's header slot.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DialogHeaderComponent = createComponentImplementation(
  DialogHeaderApi,
  ({props, buildChild}) => (
    <DialogHeaderView>{renderChildList(props.children, buildChild)}</DialogHeaderView>
  ),
);
