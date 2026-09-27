import {useId, type ChangeEvent} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextFieldApi} from './text-field.schema.js';

type TextFieldViewProps = {
  label: string;
  value: string;
  placeholder?: string;
  variant?: 'outlined' | 'filled' | 'plain';
  multiline?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

export function TextFieldView({
  label,
  value,
  placeholder,
  variant = 'outlined',
  multiline = false,
  disabled,
  onChange,
}: TextFieldViewProps) {
  const id = useId();
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange?.(event.target.value);
  const input = multiline ? (
    <textarea
      id={id}
      className="gm-field-input"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      onChange={change}
    />
  ) : (
    <input
      id={id}
      className="gm-field-input"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={change}
    />
  );
  return (
    <div className="gm-field" data-variant={variant} data-multiline={multiline ? '' : undefined}>
      <label className="gm-field-label" htmlFor={id}>
        {label}
      </label>
      {input}
      {variant === 'outlined' ? (
        <fieldset className="gm-field-outline" aria-hidden="true">
          <legend>{label}</legend>
        </fieldset>
      ) : null}
    </div>
  );
}

export const TextField = createComponentImplementation(TextFieldApi, ({props}) => {
  const setValue = (props as {setValue?: (value: string) => void}).setValue;
  return (
    <TextFieldView
      label={props.label ?? ''}
      value={props.value ?? ''}
      placeholder={props.placeholder}
      variant={props.variant}
      multiline={props.multiline}
      disabled={props.disabled}
      onChange={setValue}
    />
  );
});
