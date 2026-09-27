import {createComponentImplementation} from '@a2ui/react/v0_9';
import {LinkApi} from './link.schema.js';

/** Blue text that acts. A button underneath: its target is an action, never a URL. */
export function LinkView({
  text,
  font,
  onClick,
}: {
  text: string;
  font?: 'sans' | 'mono';
  onClick?: () => void;
}) {
  return (
    <button type="button" className="circleci-link" data-font={font ?? 'sans'} onClick={onClick}>
      {text}
    </button>
  );
}

export const Link = createComponentImplementation(LinkApi, ({props}) => (
  <LinkView text={props.text} font={props.font} onClick={props.action} />
));
