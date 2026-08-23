import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListGroupHeadingApi} from './navlist-groupheading.schema';

/** Resolved props: the Dynamic* strings resolve to plain strings; content arrives as `text`. */
type NavListGroupHeadingViewProps = {
  text: string;
  variant?: 'subtle' | 'filled';
  auxiliaryText?: string;
  visuallyHidden?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

export function NavListGroupHeadingView({
  text,
  variant,
  auxiliaryText,
  visuallyHidden,
  as,
}: NavListGroupHeadingViewProps) {
  return (
    <PrimerNavList.GroupHeading
      as={as}
      variant={variant}
      auxiliaryText={auxiliaryText}
      visuallyHidden={visuallyHidden}
    >
      {text}
    </PrimerNavList.GroupHeading>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListGroupHeadingView.
 * `text` is the resolved synthetic content channel (raw `children` -> value prop).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const NavListGroupHeadingComponent = createComponentImplementation(
  NavListGroupHeadingApi,
  ({props}) => (
    <NavListGroupHeadingView
      text={props.text}
      variant={props.variant}
      auxiliaryText={props.auxiliaryText}
      visuallyHidden={props.visuallyHidden}
      as={props.as}
    />
  ),
);
