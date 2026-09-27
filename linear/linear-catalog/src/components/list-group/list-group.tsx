import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {ListGroupApi} from './list-group.schema.js';

type ListGroupViewProps = {
  label: string;
  count?: string;
  leading?: ReactNode;
  children?: ReactNode;
};

export function ListGroupView({label, count, leading, children}: ListGroupViewProps) {
  return (
    <li className="lc-list-group" aria-label={label}>
      <div className="lc-list-group-head">
        {leading ? <span className="lc-list-group-leading">{leading}</span> : null}
        <span className="lc-list-group-label">{label}</span>
        {count ? <span className="lc-list-group-count">{count}</span> : null}
      </div>
      <ul className="lc-list">{children}</ul>
    </li>
  );
}

export const ListGroup = createComponentImplementation(ListGroupApi, ({props, buildChild}) => (
  <ListGroupView
    label={props.label ?? ''}
    count={props.count || undefined}
    leading={props.leading ? buildChild(props.leading) : undefined}
  >
    {renderChildList(props.children, buildChild)}
  </ListGroupView>
));
