import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListDescriptionApi} from './navlist-description.schema';

/** Resolved props: `text` resolves to a plain string; the rest pass through. */
type NavListDescriptionViewProps = {
  text: string;
  variant?: 'inline' | 'block';
  truncate?: boolean;
};

export function NavListDescriptionView({text, variant, truncate}: NavListDescriptionViewProps) {
  return (
    <PrimerNavList.Description variant={variant} truncate={truncate}>
      {text}
    </PrimerNavList.Description>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListDescriptionView.
 * `text` is the resolved synthetic content channel (raw `children` -> value prop).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const NavListDescriptionComponent = createComponentImplementation(
  NavListDescriptionApi,
  ({props}) => (
    <NavListDescriptionView text={props.text} variant={props.variant} truncate={props.truncate} />
  ),
);
