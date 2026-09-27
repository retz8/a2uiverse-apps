import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {ListApi} from './list.schema.js';

export function ListView({children}: {children?: ReactNode}) {
  return <ul className="lc-list">{children}</ul>;
}

export const List = createComponentImplementation(ListApi, ({props, buildChild}) => (
  <ListView>{renderChildList(props.children, buildChild)}</ListView>
));
