import type {ReactNode} from 'react';
import {Autocomplete as PrimerAutocomplete} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {AutocompleteApi} from './autocomplete.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the `ChildList` arrives as built `children` (the Input + the Overlay). */
type AutocompleteViewProps = {
  children?: ReactNode;
};

export function AutocompleteView({children}: AutocompleteViewProps) {
  // The real Primer `<Autocomplete>` wrapper provides the family context; the built children (the
  // real `<Autocomplete.Input>` and `<Autocomplete.Overlay>` → `<Autocomplete.Menu>`) consume it in
  // their true render-tree positions, so `inputValue`/`showMenu`/selection flow between them.
  return <PrimerAutocomplete>{children}</PrimerAutocomplete>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders AutocompleteView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each entry via `buildChild`
 *   into the Autocomplete context.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const AutocompleteComponent = createComponentImplementation(
  AutocompleteApi,
  ({props, buildChild}) => (
    <AutocompleteView>{renderChildList(props.children, buildChild)}</AutocompleteView>
  ),
);
