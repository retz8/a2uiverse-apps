import {SkeletonBox as PrimerSkeletonBox} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SkeletonBoxApi, type SkeletonBoxProps} from './skeletonbox.schema';

/**
 * Resolved props mirror the schema — `height`/`width` are plain strings and `delay` is a
 * plain keyword (no `Dynamic*` to resolve). The `none` keyword is the adapter's explicit
 * "no delay" value; Primer expresses that as an absent `delay` (a truthy `"none"` string
 * would satisfy Primer's `useState(!delay)` guard and keep the box hidden forever), so it
 * is translated to `undefined`.
 */
export function SkeletonBoxView({height, width, delay}: SkeletonBoxProps) {
  return (
    <PrimerSkeletonBox
      height={height}
      width={width}
      delay={delay && delay !== 'none' ? delay : undefined}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SkeletonBoxView.
 * SkeletonBox has no ComponentId/Action row, so there is no buildChild/onClick — resolved
 * values pass straight through. Props are passed explicitly (no spread): resolved props
 * include extra binder setters that would leak as unknown DOM props.
 */
export const SkeletonBoxComponent = createComponentImplementation(SkeletonBoxApi, ({props}) => (
  <SkeletonBoxView height={props.height} width={props.width} delay={props.delay} />
));
