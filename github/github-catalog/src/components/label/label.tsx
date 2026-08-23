import {Label as PrimerLabel} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {LabelApi, type LabelProps} from './label.schema';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type LabelViewProps = Omit<LabelProps, 'text'> & {text: string};

export function LabelView({text, variant, size}: LabelViewProps) {
  return (
    <PrimerLabel variant={variant} size={size}>
      {text}
    </PrimerLabel>
  );
}

/** Catalog entry: the generic binder resolves props, then renders LabelView. */
export const LabelComponent = createComponentImplementation(LabelApi, ({props}) => (
  <LabelView text={props.text} variant={props.variant} size={props.size} />
));
