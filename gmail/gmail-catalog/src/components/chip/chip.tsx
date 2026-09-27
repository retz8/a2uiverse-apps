import {createComponentImplementation} from '@a2ui/react/v0_9';
import type {IconName} from '../../icons.generated.js';
import {Glyph} from '../../shared/glyph.js';
import {ChipApi} from './chip.schema.js';

type ChipViewProps = {
  label: string;
  variant?: 'assist' | 'filter' | 'input' | 'suggestion';
  icon?: IconName;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function ChipView({
  label,
  variant = 'assist',
  icon,
  selected,
  disabled,
  onPress,
}: ChipViewProps) {
  const selectable = variant === 'filter' || variant === 'input';
  const leading = selectable && selected && variant === 'filter' ? 'check' : icon;
  return (
    <button
      type="button"
      className="gm-chip"
      data-variant={variant}
      data-selected={selected ? '' : undefined}
      data-icon={leading ? '' : undefined}
      aria-pressed={selectable && selected !== undefined ? selected : undefined}
      disabled={disabled}
      onClick={onPress}
    >
      {leading ? <Glyph name={leading} /> : null}
      <span className="gm-chip-label">{label}</span>
    </button>
  );
}

export const Chip = createComponentImplementation(ChipApi, ({props}) => {
  const selected = props.selected as boolean | undefined;
  const setSelected = (props as {setSelected?: (value: boolean) => void}).setSelected;
  const onPress = () => {
    if (selected !== undefined) setSelected?.(!selected);
    props.action?.();
  };
  return (
    <ChipView
      label={props.label ?? ''}
      variant={props.variant}
      icon={props.icon}
      selected={selected}
      disabled={props.disabled}
      onPress={onPress}
    />
  );
});
