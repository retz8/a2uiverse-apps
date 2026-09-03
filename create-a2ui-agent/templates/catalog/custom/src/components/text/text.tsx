import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextApi, type TextProps} from './text.schema.js';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type TextViewProps = Omit<TextProps, 'text'> & {text: string};

const ELEMENT: Record<NonNullable<TextProps['variant']>, 'h1' | 'h2' | 'h3' | 'p' | 'small'> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  caption: 'small',
};

/**
 * The seed view: plain HTML, so the catalog renders before the design system is wired.
 * TODO: render with the design system's text primitive instead.
 */
export function TextView({text, variant = 'body'}: TextViewProps) {
  const Element = ELEMENT[variant];
  return <Element data-variant={variant}>{text}</Element>;
}

/** Catalog entry: the generic binder resolves props, then renders TextView. */
export const TextComponent = createComponentImplementation(TextApi, ({props}) => (
  <TextView text={props.text} variant={props.variant} />
));
