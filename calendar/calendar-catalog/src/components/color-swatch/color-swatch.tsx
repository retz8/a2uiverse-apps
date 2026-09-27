import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ColorSwatchApi} from './color-swatch.schema.js';
import type {EventColor} from './event-colors.js';

export function ColorSwatchView({
  color,
  shape = 'square',
}: {
  color: EventColor;
  shape?: 'square' | 'dot';
}) {
  return <span className="gc-swatch" data-color={color} data-shape={shape} aria-hidden="true" />;
}

export const ColorSwatch = createComponentImplementation(ColorSwatchApi, ({props}) => (
  <ColorSwatchView color={props.color} shape={props.shape} />
));
