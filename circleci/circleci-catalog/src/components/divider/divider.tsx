import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DividerApi} from './divider.schema.js';

/** A 1px rule; a vertical one separates the fields of a row. */
export function DividerView({orientation}: {orientation?: 'horizontal' | 'vertical'}) {
  const axis = orientation ?? 'horizontal';
  return (
    <div
      className="circleci-divider"
      role="separator"
      aria-orientation={axis}
      data-orientation={axis}
    />
  );
}

export const Divider = createComponentImplementation(DividerApi, ({props}) => (
  <DividerView orientation={props.orientation} />
));
