import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ButtonApi} from './button.schema.js';

type ButtonViewProps = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium';
  disabled?: boolean;
  onClick?: () => void;
};

/** The pill button: `primary` the one solid call to action, `secondary` a grey fill, `ghost` text only. */
export function ButtonView({label, variant, size, disabled, onClick}: ButtonViewProps) {
  return (
    <button
      type="button"
      className="circleci-button"
      data-variant={variant ?? 'secondary'}
      data-size={size ?? 'medium'}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export const Button = createComponentImplementation(ButtonApi, ({props}) => (
  <ButtonView
    label={props.label}
    variant={props.variant}
    size={props.size}
    disabled={props.disabled}
    onClick={props.action}
  />
));
