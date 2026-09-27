import type {KeyboardEvent, ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {ListItemApi} from './list-item.schema.js';

type ListItemViewProps = {
  leading?: ReactNode;
  trailing?: ReactNode;
  onAction?: () => void;
  children?: ReactNode;
};

export function ListItemView({leading, trailing, onAction, children}: ListItemViewProps) {
  const row = (
    <>
      {leading ? <span className="lc-list-item-leading">{leading}</span> : null}
      <span className="lc-list-item-content">{children}</span>
      {trailing ? <span className="lc-list-item-trailing">{trailing}</span> : null}
    </>
  );
  if (!onAction) {
    return (
      <li className="lc-list-item">
        <div className="lc-row">{row}</div>
      </li>
    );
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAction();
    }
  };
  return (
    <li className="lc-list-item">
      <div
        className="lc-row"
        data-interactive=""
        role="button"
        tabIndex={0}
        onClick={onAction}
        onKeyDown={onKeyDown}
      >
        {row}
      </div>
    </li>
  );
}

export const ListItem = createComponentImplementation(ListItemApi, ({props, buildChild}) => (
  <ListItemView
    leading={props.leading ? renderChildList(props.leading, buildChild) : undefined}
    trailing={props.trailing ? renderChildList(props.trailing, buildChild) : undefined}
    onAction={props.action}
  >
    {buildChild(props.child)}
  </ListItemView>
));
