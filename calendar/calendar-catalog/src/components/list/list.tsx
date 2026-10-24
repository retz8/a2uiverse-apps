import {Children, type ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {ListApi} from './list.schema.js';

type ListViewProps = {
  dividers?: boolean;
  layout?: 'stacked' | 'inline';
  children?: ReactNode;
};

/** Each child sits in an `<li>` of the list's own, the element its component renders in inside it. */
export function ListView({dividers = false, layout = 'stacked', children}: ListViewProps) {
  return (
    <ul className="gc-list" data-dividers={dividers ? '' : undefined} data-layout={layout}>
      {Children.map(children, child => (
        <li>{child}</li>
      ))}
    </ul>
  );
}

export const List = createComponentImplementation(ListApi, ({props, buildChild}) => (
  <ListView dividers={props.dividers} layout={props.layout}>
    {renderChildList(props.children, buildChild)}
  </ListView>
));
