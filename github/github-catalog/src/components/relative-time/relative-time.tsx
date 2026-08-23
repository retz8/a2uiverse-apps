import {RelativeTime as PrimerRelativeTime} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {RelativeTimeApi, type RelativeTimeProps} from './relative-time.schema';

/** Resolved props: `datetime` is a plain ISO string after the binder resolves the DynamicString. */
type RelativeTimeViewProps = Omit<RelativeTimeProps, 'datetime'> & {datetime: string};

export function RelativeTimeView(props: RelativeTimeViewProps) {
  // The Primer wrapper forwards every prop straight onto the underlying `<relative-time>` custom
  // element, whose property setters stringify `undefined` into literal "undefined"/"" attributes
  // that corrupt the element's own formatting (e.g. `format="undefined"`). Forward only the props
  // that are actually set — equivalent to how a React consumer omits an unset prop. This builds a
  // fresh plain object (not the binder-resolved one), so spreading it is safe.
  const defined = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as RelativeTimeViewProps;
  return <PrimerRelativeTime {...defined} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders RelativeTimeView. RelativeTime
 * has no ComponentId/Action row, so there is no buildChild/onClick — resolved values pass
 * straight through. Props are passed explicitly (no spread): resolved props include extra binder
 * setters that would otherwise leak as unknown DOM props.
 */
export const RelativeTimeComponent = createComponentImplementation(RelativeTimeApi, ({props}) => (
  <RelativeTimeView
    datetime={props.datetime}
    format={props.format}
    formatStyle={props.formatStyle}
    tense={props.tense}
    precision={props.precision}
    threshold={props.threshold}
    prefix={props.prefix}
    second={props.second}
    minute={props.minute}
    hour={props.hour}
    weekday={props.weekday}
    day={props.day}
    month={props.month}
    year={props.year}
    timeZoneName={props.timeZoneName}
    noTitle={props.noTitle}
  />
));
