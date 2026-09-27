import {createComponentImplementation} from '@a2ui/react/v0_9';
import {Glyph} from '../../shared/glyph.js';
import {IconApi, type IconProps} from './icon.schema.js';

export function IconView({name, filled, size = 'large', color = 'onSurfaceVariant'}: IconProps) {
  return (
    <span className="gc-icon" data-size={size} data-color={color}>
      <Glyph name={name} filled={filled} />
    </span>
  );
}

export const Icon = createComponentImplementation(IconApi, ({props}) => (
  <IconView name={props.name} filled={props.filled} size={props.size} color={props.color} />
));
