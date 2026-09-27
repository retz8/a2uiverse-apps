import {createComponentImplementation} from '@a2ui/react/v0_9';
import {HeadingApi} from './heading.schema.js';

type Size = 'large' | 'medium' | 'small';

/** The heading element per size, so a surface's outline reads in order. */
const ELEMENT = {large: 'h2', medium: 'h3', small: 'h4'} as const;

export function HeadingView({text, size}: {text: string; size?: Size}) {
  const resolved = size ?? 'medium';
  const Element = ELEMENT[resolved];
  return (
    <Element className="circleci-heading" data-size={resolved}>
      {text}
    </Element>
  );
}

export const Heading = createComponentImplementation(HeadingApi, ({props}) => (
  <HeadingView text={props.text} size={props.size} />
));
