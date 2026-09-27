import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {IconName} from '../../icons.generated.js';
import {Glyph} from '../../shared/glyph.js';
import {IconButtonApi} from './icon-button.schema.js';

type IconButtonViewProps = {
  icon: IconName;
  label: string;
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function IconButtonView({
  icon,
  label,
  variant = 'standard',
  selected,
  disabled,
  onPress,
}: IconButtonViewProps) {
  const toggle = selected !== undefined;
  return (
    <button
      type="button"
      className="gm-icon-button"
      data-variant={variant}
      data-selected={selected ? '' : undefined}
      aria-label={label}
      aria-pressed={toggle ? selected : undefined}
      title={label}
      disabled={disabled}
      onClick={onPress}
    >
      <Glyph name={icon} filled={selected} />
    </button>
  );
}

export const IconButton = createComponentImplementation(IconButtonApi, ({props}) => {
  const selected = props.selected as boolean | undefined;
  const setSelected = (props as {setSelected?: (value: boolean) => void}).setSelected;
  const onPress = () => {
    if (selected !== undefined) setSelected?.(!selected);
    props.action?.();
  };
  return (
    <IconButtonView
      icon={props.icon}
      label={props.label}
      variant={props.variant}
      selected={selected}
      disabled={props.disabled}
      onPress={onPress}
    />
  );
});
