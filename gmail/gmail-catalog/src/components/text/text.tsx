import {createElement, type CSSProperties} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextApi, type TextProps, type TypeRole} from './text.schema.js';

/** Display and headline roles title a surface; title roles head its sections. */
function elementOf(variant: TypeRole): 'h2' | 'h3' | 'span' {
  if (variant.startsWith('display') || variant.startsWith('headline') || variant === 'titleLarge')
    return 'h2';
  if (variant.startsWith('title')) return 'h3';
  return 'span';
}

type TextViewProps = Omit<TextProps, 'text'> & {text: string};

export function TextView({
  text,
  variant = 'bodyMedium',
  weight,
  color = 'onSurface',
  maxLines,
}: TextViewProps) {
  return createElement(
    elementOf(variant),
    {
      className: 'gm-text',
      'data-variant': variant,
      'data-weight': weight,
      'data-color': color,
      'data-clamp': maxLines ? '' : undefined,
      style: maxLines ? ({'--gm-text-lines': maxLines} as CSSProperties) : undefined,
      title: maxLines ? text : undefined,
    },
    text,
  );
}

export const Text = createComponentImplementation(TextApi, ({props}) => (
  <TextView
    text={props.text ?? ''}
    variant={props.variant}
    weight={props.weight}
    color={props.color}
    maxLines={props.maxLines}
  />
));
