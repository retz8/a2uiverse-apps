import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListDescriptionApi} from './actionlist-description.schema';

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString. */
type ActionListDescriptionViewProps = {
  text: string;
  variant?: 'inline' | 'block';
  truncate?: boolean;
};

export function ActionListDescriptionView({
  text,
  variant,
  truncate,
}: ActionListDescriptionViewProps) {
  return (
    <PrimerActionList.Description variant={variant} truncate={truncate}>
      {text}
    </PrimerActionList.Description>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListDescriptionView.
 * `Description` has no ComponentId/Action row (its content is the synthetic `text`), so there is
 * no buildChild/onClick — resolved values pass straight through.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListDescriptionComponent = createComponentImplementation(
  ActionListDescriptionApi,
  ({props}) => (
    <ActionListDescriptionView
      text={props.text}
      variant={props.variant}
      truncate={props.truncate}
    />
  ),
);
