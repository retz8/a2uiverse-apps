import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ButtonApi} from './button.schema.js';

type ButtonViewProps = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  leading?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

export function ButtonView({label, variant, leading, disabled, onClick}: ButtonViewProps) {
  return (
    <button
      type="button"
      className="lc-button"
      data-variant={variant ?? 'secondary'}
      disabled={disabled}
      onClick={onClick}
    >
      {leading ? <span className="lc-button-leading">{leading}</span> : null}
      <span className="lc-button-label">{label}</span>
    </button>
  );
}

export const Button = createComponentImplementation(ButtonApi, ({props, buildChild}) => (
  <ButtonView
    label={props.label ?? ''}
    variant={props.variant}
    leading={props.leading ? buildChild(props.leading) : undefined}
    disabled={props.disabled}
    onClick={props.action}
  />
));
