import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ListItemApi} from './list-item.schema.js';

/** A row; with an action, the whole row is one button that washes on hover. */
export function ListItemView({onClick, children}: {onClick?: () => void; children?: ReactNode}) {
  return (
    <div className="circleci-list-item" role="listitem">
      {onClick ? (
        <button type="button" className="circleci-list-item-action" onClick={onClick}>
          {children}
        </button>
      ) : (
        children
      )}
    </div>
  );
}

export const ListItem = createComponentImplementation(ListItemApi, ({props, buildChild}) => (
  <ListItemView onClick={props.action}>{buildChild(props.child)}</ListItemView>
));
