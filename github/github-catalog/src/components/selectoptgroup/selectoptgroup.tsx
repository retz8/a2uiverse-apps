import type {ReactNode} from 'react';
import {Select as PrimerSelect} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SelectOptGroupApi} from './selectoptgroup.schema';
import {renderChildList} from '../../shared/child-list';

/**
 * Resolved props: `label` is the plain string after the binder resolves the DynamicString;
 * `disabled` is the resolved boolean; `children` arrives as a built `ChildList` of options.
 */
type SelectOptGroupViewProps = {
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
};

export function SelectOptGroupView({label, disabled, children}: SelectOptGroupViewProps) {
  return (
    <PrimerSelect.OptGroup label={label} disabled={disabled}>
      {children}
    </PrimerSelect.OptGroup>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SelectOptGroupView.
 * - `props.children` is a resolved `ChildList` of `Select.Option`s; `renderChildList` builds each
 *   via `buildChild` as the `<optgroup>`'s option children.
 * - `label`/`disabled` resolve as pass-throughs.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SelectOptGroupComponent = createComponentImplementation(
  SelectOptGroupApi,
  ({props, buildChild}) => (
    <SelectOptGroupView label={props.label} disabled={props.disabled}>
      {renderChildList(props.children, buildChild)}
    </SelectOptGroupView>
  ),
);
