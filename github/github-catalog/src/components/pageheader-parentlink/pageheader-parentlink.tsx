import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderParentLinkApi} from './pageheader-parentlink.schema';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: `text`/`href`/`aria-label` are plain strings after the binder resolves the
 * DynamicStrings. Mirrors the shipped Link leaf (content via a synthetic `text` prop). */
type PageHeaderParentLinkViewProps = {
  text: string;
  href: string;
  ariaLabel?: string;
  hidden?: Responsive<boolean>;
};

export function PageHeaderParentLinkView({
  text,
  href,
  ariaLabel,
  hidden,
}: PageHeaderParentLinkViewProps) {
  return (
    <PrimerPageHeader.ParentLink href={href} aria-label={ariaLabel} hidden={hidden}>
      {text}
    </PrimerPageHeader.ParentLink>
  );
}

/** Catalog entry: navigation is via `href` (no Action), so resolved values pass straight through. */
export const PageHeaderParentLinkComponent = createComponentImplementation(
  PageHeaderParentLinkApi,
  ({props}) => (
    <PageHeaderParentLinkView
      text={props.text}
      href={props.href}
      ariaLabel={props['aria-label']}
      hidden={props.hidden}
    />
  ),
);
