import {type ReactNode, useEffect} from 'react';
import {Details as PrimerDetails, useDetails} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DetailsApi} from './details.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* -> primitives; ComponentId/ChildList slots arrive as built nodes. */
type DetailsViewProps = {
  open?: boolean;
  closeOnOutsideClick?: boolean;
  /** Resolved Action (event vs functionCall routing already done by the renderer). */
  onClickOutside?: () => void;
  accessibility?: ResolvedAccessibility;
  /** The always-visible label, built from the `summary` ComponentId. */
  summary?: ReactNode;
  /** The collapsible body, built from the `children` ChildList. */
  children?: ReactNode;
  /** The two-way write-back: the binder's auto-generated setOpen, called with the new state. */
  setOpen?: (open: boolean) => void;
};

export function DetailsView({
  open,
  closeOnOutsideClick,
  onClickOutside,
  accessibility,
  summary,
  children,
  setOpen,
}: DetailsViewProps) {
  // useDetails owns outside-click detection (the documented idiomatic surface), but the bound
  // `open` path stays the source of truth. Two guarded effects keep the hook's interactive
  // open-state and the bound path in lockstep.
  const {
    open: hookOpen,
    setOpen: setHookOpen,
    getDetailsProps,
  } = useDetails({closeOnOutsideClick, defaultOpen: open, onClickOutside});

  // path -> hook: an external data-model change to `open` syncs into the hook's open-state.
  // (react-hooks/exhaustive-deps is not enforced in the adapter package; `hookOpen` is
  // intentionally omitted so this effect only reacts to external `open` changes.)
  useEffect(() => {
    if (hookOpen !== open) setHookOpen(open);
  }, [open]);

  // hook -> path: a summary toggle or an outside-click writes the new open-state back to the path.
  // (`open` is intentionally omitted so this effect only reacts to interactive hook changes.)
  useEffect(() => {
    if (hookOpen !== open) setOpen?.(!!hookOpen);
  }, [hookOpen]);

  return (
    <PrimerDetails
      {...getDetailsProps()}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      <PrimerDetails.Summary>{summary}</PrimerDetails.Summary>
      {children}
    </PrimerDetails>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders DetailsView.
 * - `props.open` is the resolved boolean; `props.setOpen` is the auto-generated two-way setter
 *   (GenerateSetters, from the DynamicBoolean prop) wired to the summary-toggle / outside-click
 *   write-back. No `onToggle` Action — the state change *is* the write-back (the Checkbox pattern).
 * - `props.summary` is a ComponentId built via buildChild (rendered inside Details.Summary);
 *   `props.children` is a resolved ChildList built via renderChildList (the collapsible body).
 * - `props.onClickOutside` is the resolved Action closure; `props.accessibility` carries resolved
 *   (plain-string) label/description, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const DetailsComponent = createComponentImplementation(DetailsApi, ({props, buildChild}) => (
  <DetailsView
    open={props.open}
    closeOnOutsideClick={props.closeOnOutsideClick}
    onClickOutside={props.onClickOutside}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
    setOpen={props.setOpen}
    summary={props.summary ? buildChild(props.summary) : undefined}
  >
    {renderChildList(props.children, buildChild)}
  </DetailsView>
));
