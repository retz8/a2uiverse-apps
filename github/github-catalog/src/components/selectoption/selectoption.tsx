import {Select as PrimerSelect} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SelectOptionApi} from './selectoption.schema';

/**
 * Resolved props: `text`/`value` are plain strings after the binder resolves their DynamicStrings;
 * `disabled` is the resolved boolean. `text` renders as the option's child (its visible label).
 */
type SelectOptionViewProps = {
  text: string;
  value: string;
  disabled?: boolean;
};

export function SelectOptionView({text, value, disabled}: SelectOptionViewProps) {
  return (
    <PrimerSelect.Option value={value} disabled={disabled}>
      {text}
    </PrimerSelect.Option>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SelectOptionView. There is no
 * ComponentId/Action row, so the resolved values pass straight through (no buildChild/onClick).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SelectOptionComponent = createComponentImplementation(SelectOptionApi, ({props}) => (
  <SelectOptionView text={props.text} value={props.value} disabled={props.disabled} />
));
