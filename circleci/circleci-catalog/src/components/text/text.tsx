import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextApi, type TextProps} from './text.schema.js';

type TextViewProps = Omit<TextProps, 'text'> & {text: string};

export function TextView({text, size, tone, weight, font, truncate}: TextViewProps) {
  return (
    <span
      className="circleci-text"
      data-size={size ?? 'medium'}
      data-tone={tone ?? 'default'}
      data-weight={weight ?? 'normal'}
      data-font={font ?? 'sans'}
      data-truncate={truncate ? 'true' : undefined}
      title={truncate ? text : undefined}
    >
      {text}
    </span>
  );
}

export const Text = createComponentImplementation(TextApi, ({props}) => (
  <TextView
    text={props.text}
    size={props.size}
    tone={props.tone}
    weight={props.weight}
    font={props.font}
    truncate={props.truncate}
  />
));
