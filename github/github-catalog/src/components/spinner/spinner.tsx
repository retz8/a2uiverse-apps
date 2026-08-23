import {Spinner as PrimerSpinner} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SpinnerApi, type SpinnerProps} from './spinner.schema';

/**
 * Resolved props: `srText` is a plain string (or `null`) after the binder resolves the
 * DynamicString. `delay`'s `'none'` arm maps to Primer's no-delay (`undefined`), so the
 * spinner renders immediately.
 */
type SpinnerViewProps = Omit<SpinnerProps, 'srText'> & {srText?: string | null};

export function SpinnerView({size, srText, delay}: SpinnerViewProps) {
  return (
    <PrimerSpinner
      size={size}
      srText={srText}
      delay={delay === undefined || delay === 'none' ? undefined : delay}
    />
  );
}

/** Catalog entry: the generic binder resolves props, then renders SpinnerView. */
export const SpinnerComponent = createComponentImplementation(SpinnerApi, ({props}) => (
  <SpinnerView size={props.size} srText={props.srText} delay={props.delay} />
));
