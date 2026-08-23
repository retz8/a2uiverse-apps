import type {ComponentType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListHeadingApi} from './actionlist-heading.schema';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type ActionListHeadingViewProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'small' | 'medium' | 'large';
  visuallyHidden?: boolean;
};

/**
 * Primer ActionList.Heading is a strict polymorphic (`as` required). Cast it to a plain component
 * typed with exactly the props we drive; the enums are schema-validated. `as` defaults to `h3`
 * at render (Primer's documented default) when the agent omits it — a runtime fallback, not a
 * zod schema default.
 */
const Heading = PrimerActionList.Heading as unknown as ComponentType<{
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'small' | 'medium' | 'large';
  visuallyHidden?: boolean;
  children?: ReactNode;
}>;

export function ActionListHeadingView({
  text,
  as,
  size,
  visuallyHidden,
}: ActionListHeadingViewProps) {
  return (
    <Heading as={as ?? 'h3'} size={size} visuallyHidden={visuallyHidden}>
      {text}
    </Heading>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListHeadingView.
 * `Heading` has no ComponentId/Action row (its content is the synthetic `text`), so there is no
 * buildChild/onClick — resolved values pass straight through.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListHeadingComponent = createComponentImplementation(
  ActionListHeadingApi,
  ({props}) => (
    <ActionListHeadingView
      text={props.text}
      as={props.as}
      size={props.size}
      visuallyHidden={props.visuallyHidden}
    />
  ),
);
