import {Link as PrimerLink} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {LinkApi} from './link.schema';

/** Resolved accessibility: the nested DynamicStrings are plain strings post-binder. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: `text`/`href` are plain strings after the binder resolves the DynamicStrings. */
type LinkViewProps = {
  text: string;
  href: string;
  muted?: boolean;
  inline?: boolean;
  target?: '_self' | '_blank';
  accessibility?: ResolvedAccessibility;
};

export function LinkView({text, href, muted, inline, target, accessibility}: LinkViewProps) {
  return (
    <PrimerLink
      href={href}
      muted={muted}
      inline={inline}
      target={target}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {text}
    </PrimerLink>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders LinkView. Link has no
 * ComponentId/Action row (navigation only, via `href`), so there is no buildChild/onClick
 * — resolved values pass straight through. `accessibility` carries a resolved (plain-string)
 * label/description at runtime; its inferred type still shows the nested DynamicString, so
 * it is cast. Props are passed explicitly (no spread): resolved props include extra binder
 * setters.
 */
export const LinkComponent = createComponentImplementation(LinkApi, ({props}) => (
  <LinkView
    text={props.text}
    href={props.href}
    muted={props.muted}
    inline={props.inline}
    target={props.target}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
  />
));
