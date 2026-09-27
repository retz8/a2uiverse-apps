import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {pressOnKey} from '../../shared/press.js';
import {ListItemApi} from './list-item.schema.js';

type ListItemViewProps = {
  headline: ReactNode;
  supporting?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
};

export function ListItemView({
  headline,
  supporting,
  meta,
  leading,
  trailing,
  selected,
  onPress,
}: ListItemViewProps) {
  const interactive = onPress !== undefined;
  return (
    <li className="gc-list-item" data-selected={selected ? '' : undefined}>
      <div
        className="gc-list-row"
        data-interactive={interactive ? '' : undefined}
        data-leading={leading ? '' : undefined}
        data-trailing={trailing ? '' : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onPress}
        onKeyDown={interactive ? pressOnKey(onPress) : undefined}
      >
        {leading ? <span className="gc-list-leading">{leading}</span> : null}
        <span className="gc-list-headline">{headline}</span>
        {supporting ? <span className="gc-list-supporting">{supporting}</span> : null}
        {meta ? <span className="gc-list-meta">{meta}</span> : null}
        {trailing ? <span className="gc-list-trailing">{trailing}</span> : null}
      </div>
    </li>
  );
}

export const ListItem = createComponentImplementation(ListItemApi, ({props, buildChild}) => (
  <ListItemView
    headline={buildChild(props.headline)}
    supporting={props.supporting ? buildChild(props.supporting) : undefined}
    meta={props.meta ? buildChild(props.meta) : undefined}
    leading={props.leading ? renderChildList(props.leading, buildChild) : undefined}
    trailing={props.trailing ? renderChildList(props.trailing, buildChild) : undefined}
    selected={props.selected}
    onPress={props.action}
  />
));
