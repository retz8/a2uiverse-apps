import {Text as PrimerText} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextApi, type TextProps} from './text.schema';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type TextViewProps = Omit<TextProps, 'text'> & {text: string};

export function TextView({text, as, size, weight, whiteSpace}: TextViewProps) {
  return (
    <PrimerText as={as} size={size} weight={weight} whiteSpace={whiteSpace}>
      {text}
    </PrimerText>
  );
}

/** Catalog entry: the generic binder resolves props, then renders TextView. */
export const TextComponent = createComponentImplementation(TextApi, ({props}) => (
  <TextView
    text={props.text}
    as={props.as}
    size={props.size}
    weight={props.weight}
    whiteSpace={props.whiteSpace}
  />
));
