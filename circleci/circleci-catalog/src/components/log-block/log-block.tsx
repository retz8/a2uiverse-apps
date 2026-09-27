import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {LogBlockApi} from './log-block.schema.js';
import {renderChildList} from '../../shared/child-list.js';

/** The dark log panel; the stylesheet numbers its lines in a gutter. */
export function LogBlockView({children}: {children?: ReactNode}) {
  return <div className="circleci-log-block">{children}</div>;
}

export const LogBlock = createComponentImplementation(LogBlockApi, ({props, buildChild}) => (
  <LogBlockView>{renderChildList(props.children, buildChild)}</LogBlockView>
));
