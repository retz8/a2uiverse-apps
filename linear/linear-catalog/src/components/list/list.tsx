import {Children, type ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {ListApi} from './list.schema.js';

/** Each child sits in an `<li>` of the list's own, the element its component renders in inside it. */
export function ListView({children}: {children?: ReactNode}) {
  return (
    <ul className="lc-list">
      {Children.map(children, child => (
        <li>{child}</li>
      ))}
    </ul>
  );
}

export const List = createComponentImplementation(ListApi, ({props, buildChild}) => (
  <ListView>{renderChildList(props.children, buildChild)}</ListView>
));
