import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ListApi} from './list.schema.js';
import {renderChildList} from '../../shared/child-list.js';

/** A list of rows; `tree` joins them with the connector drawn from the list's left edge. */
export function ListView({
  connector,
  children,
}: {
  connector?: 'none' | 'tree';
  children?: ReactNode;
}) {
  return (
    <div className="circleci-list" role="list" data-connector={connector ?? 'none'}>
      {children}
    </div>
  );
}

export const List = createComponentImplementation(ListApi, ({props, buildChild}) => (
  <ListView connector={props.connector}>{renderChildList(props.children, buildChild)}</ListView>
));
