import {createComponentImplementation} from '@a2ui/react/v0_9';
import {DividerApi} from './divider.schema.js';

export function DividerView() {
  return <hr className="lc-divider" />;
}

export const Divider = createComponentImplementation(DividerApi, () => <DividerView />);
