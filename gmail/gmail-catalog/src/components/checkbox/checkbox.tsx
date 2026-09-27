import {createComponentImplementation} from '@a2ui/react/v0_9';
import {Glyph} from '../../shared/glyph.js';
import {CheckboxApi} from './checkbox.schema.js';

type CheckboxViewProps = {
  checked: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

export function CheckboxView({checked, label, disabled, onChange}: CheckboxViewProps) {
  return (
    <label className="gm-checkbox" data-checked={checked ? '' : undefined}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label ? undefined : 'Select'}
        onChange={event => onChange?.(event.target.checked)}
      />
      <span className="gm-checkbox-box" aria-hidden="true">
        {checked ? <Glyph name="check" /> : null}
      </span>
      {label ? <span className="gm-checkbox-label">{label}</span> : null}
    </label>
  );
}

export const Checkbox = createComponentImplementation(CheckboxApi, ({props}) => {
  const setValue = (props as {setValue?: (value: boolean) => void}).setValue;
  const onChange = (checked: boolean) => {
    setValue?.(checked);
    props.action?.();
  };
  return (
    <CheckboxView
      checked={props.value ?? false}
      label={props.label}
      disabled={props.disabled}
      onChange={onChange}
    />
  );
});
