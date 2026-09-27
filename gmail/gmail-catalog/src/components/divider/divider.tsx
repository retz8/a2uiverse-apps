import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DividerApi} from './divider.schema.js';

export function DividerView({inset = 'none'}: {inset?: 'none' | 'start' | 'middle'}) {
  return <hr className="gm-divider" data-inset={inset} />;
}

export const Divider = createComponentImplementation(DividerApi, ({props}) => (
  <DividerView inset={props.inset} />
));
