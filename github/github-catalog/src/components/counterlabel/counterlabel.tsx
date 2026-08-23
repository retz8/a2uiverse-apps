import {CounterLabel as PrimerCounterLabel} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {CounterLabelApi, type CounterLabelProps} from './counterlabel.schema';

/** Resolved props: `count` is a plain number after the binder resolves the DynamicNumber. */
type CounterLabelViewProps = Omit<CounterLabelProps, 'count'> & {count: number};

export function CounterLabelView({count, variant}: CounterLabelViewProps) {
  return <PrimerCounterLabel variant={variant}>{count}</PrimerCounterLabel>;
}

/** Catalog entry: the generic binder resolves props, then renders CounterLabelView. */
export const CounterLabelComponent = createComponentImplementation(CounterLabelApi, ({props}) => (
  <CounterLabelView count={props.count} variant={props.variant} />
));
