import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {IconName} from '../../icons.generated.js';
import {Glyph} from '../../shared/glyph.js';
import {ButtonApi} from './button.schema.js';

type ButtonViewProps = {
  label: string;
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
  icon?: IconName;
  disabled?: boolean;
  onPress?: () => void;
};

export function ButtonView({label, variant = 'filled', icon, disabled, onPress}: ButtonViewProps) {
  return (
    <button
      type="button"
      className="gc-button"
      data-variant={variant}
      data-icon={icon ? '' : undefined}
      disabled={disabled}
      onClick={onPress}
    >
      {icon ? <Glyph name={icon} /> : null}
      <span className="gc-button-label">{label}</span>
    </button>
  );
}

export const Button = createComponentImplementation(ButtonApi, ({props}) => (
  <ButtonView
    label={props.label ?? ''}
    variant={props.variant}
    icon={props.icon}
    disabled={props.disabled}
    onPress={props.action}
  />
));
