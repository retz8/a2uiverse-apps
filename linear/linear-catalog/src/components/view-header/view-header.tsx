import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {ViewHeaderApi} from './view-header.schema.js';

type ViewHeaderViewProps = {title: string; context?: string; trailing?: ReactNode};

export function ViewHeaderView({title, context, trailing}: ViewHeaderViewProps) {
  return (
    <header className="lc-view-header">
      <span className="lc-view-header-path">
        {context ? (
          <>
            <span className="lc-view-header-context">{context}</span>
            <span className="lc-view-header-sep" aria-hidden>
              ›
            </span>
          </>
        ) : null}
        <span className="lc-view-header-title">{title}</span>
      </span>
      {trailing ? <span className="lc-view-header-trailing">{trailing}</span> : null}
    </header>
  );
}

export const ViewHeader = createComponentImplementation(ViewHeaderApi, ({props, buildChild}) => (
  <ViewHeaderView
    title={props.title ?? ''}
    context={props.context || undefined}
    trailing={props.trailing ? renderChildList(props.trailing, buildChild) : undefined}
  />
));
