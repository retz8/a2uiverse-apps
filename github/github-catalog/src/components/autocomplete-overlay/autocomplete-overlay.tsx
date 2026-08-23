import type {ReactNode} from 'react';
import {Autocomplete as PrimerAutocomplete} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AutocompleteOverlayApi} from './autocomplete-overlay.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the `ChildList` arrives as built `children` (the suggestion Menu). */
type AutocompleteOverlayViewProps = {
  children?: ReactNode;
};

export function AutocompleteOverlayView({children}: AutocompleteOverlayViewProps) {
  // The real Primer `<Autocomplete.Overlay>` floats the panel and auto-positions it against the
  // input via the Autocomplete context; the built Menu renders inside it.
  return <PrimerAutocomplete.Overlay>{children}</PrimerAutocomplete.Overlay>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders AutocompleteOverlayView.
 * - `props.children` is a resolved `ChildList` (the Menu); `renderChildList` builds each entry via
 *   `buildChild` into the floating panel.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const AutocompleteOverlayComponent = createComponentImplementation(
  AutocompleteOverlayApi,
  ({props, buildChild}) => (
    <AutocompleteOverlayView>{renderChildList(props.children, buildChild)}</AutocompleteOverlayView>
  ),
);
