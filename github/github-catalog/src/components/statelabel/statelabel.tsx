import {StateLabel as PrimerStateLabel} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StateLabelApi, STATELABEL_STATUSES, type StateLabelProps} from './statelabel.schema';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type StateLabelViewProps = Omit<StateLabelProps, 'text'> & {text: string};

const VALID_STATUSES = new Set<string>(STATELABEL_STATUSES);

export function StateLabelView({text, status, size}: StateLabelViewProps) {
  // A streamed surface can render before `status` resolves (or with an invalid
  // value a live agent emitted); Primer maps unknown statuses to an undefined
  // icon component and crashes the tree. Render nothing rather than crash.
  if (typeof status !== 'string' || !VALID_STATUSES.has(status)) return null;
  return (
    <PrimerStateLabel status={status} size={size}>
      {text}
    </PrimerStateLabel>
  );
}

/** Catalog entry: the generic binder resolves props, then renders StateLabelView. */
export const StateLabelComponent = createComponentImplementation(StateLabelApi, ({props}) => (
  <StateLabelView text={props.text} status={props.status} size={props.size} />
));
