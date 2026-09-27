import {useMemo} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderMarkdown} from '../../markdown.js';
import {MarkdownApi} from './markdown.schema.js';

export function MarkdownView({text}: {text: string}) {
  const html = useMemo(() => renderMarkdown(text), [text]);
  return <div className="lc-markdown" dangerouslySetInnerHTML={{__html: html}} />;
}

export const Markdown = createComponentImplementation(MarkdownApi, ({props}) => (
  <MarkdownView text={props.text ?? ''} />
));
