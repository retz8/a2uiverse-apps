import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextApi, type TextProps, type TextVariant} from './text.schema.js';

const ELEMENT: Record<TextVariant, 'h2' | 'h3' | 'span'> = {
  title: 'h2',
  heading: 'h3',
  body: 'span',
  secondary: 'span',
  caption: 'span',
};

type TextViewProps = Omit<TextProps, 'text'> & {text: string};

export function TextView({text, variant = 'body', weight, truncate}: TextViewProps) {
  const Element = ELEMENT[variant];
  return (
    <Element
      className="lc-text"
      data-variant={variant}
      data-weight={weight}
      data-truncate={truncate ? '' : undefined}
      title={truncate ? text : undefined}
    >
      {text}
    </Element>
  );
}

export const Text = createComponentImplementation(TextApi, ({props}) => (
  <TextView
    text={props.text ?? ''}
    variant={props.variant}
    weight={props.weight}
    truncate={props.truncate}
  />
));
