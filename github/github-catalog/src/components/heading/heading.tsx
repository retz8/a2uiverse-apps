import {Heading as PrimerHeading} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {HeadingApi, type HeadingProps} from './heading.schema';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type HeadingViewProps = Omit<HeadingProps, 'text'> & {text: string};

export function HeadingView({text, as, variant}: HeadingViewProps) {
  return (
    <PrimerHeading as={as} variant={variant}>
      {text}
    </PrimerHeading>
  );
}

/** Catalog entry: the generic binder resolves props, then renders HeadingView. */
export const HeadingComponent = createComponentImplementation(HeadingApi, ({props}) => (
  <HeadingView text={props.text} as={props.as} variant={props.variant} />
));
