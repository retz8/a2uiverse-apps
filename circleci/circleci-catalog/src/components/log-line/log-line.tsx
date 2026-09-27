import {createComponentImplementation} from '@a2ui/react/v0_9';
import {LogLineApi} from './log-line.schema.js';

/** One line of output, as printed; its number is drawn by the log block's gutter. */
export function LogLineView({text}: {text: string}) {
  return <div className="circleci-log-line">{text}</div>;
}

export const LogLine = createComponentImplementation(LogLineApi, ({props}) => (
  <LogLineView text={props.text} />
));
