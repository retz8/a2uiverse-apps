import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TagApi} from './tag.schema.js';

export function TagView({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'primary' | 'error';
}) {
  return (
    <span className="gm-tag" data-tone={tone}>
      {text}
    </span>
  );
}

export const Tag = createComponentImplementation(TagApi, ({props}) => (
  <TagView text={props.text ?? ''} tone={props.tone} />
));
