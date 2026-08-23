import {Breadcrumbs as PrimerBreadcrumbs} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {BreadcrumbsItemApi} from './breadcrumbsitem.schema';

/** Resolved accessibility: the nested DynamicStrings are plain strings post-binder. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: `label`/`href` are plain strings and `selected` a plain boolean post-binder. */
type BreadcrumbsItemViewProps = {
  label: string;
  href?: string;
  selected?: boolean;
  target?: '_self' | '_blank';
  accessibility?: ResolvedAccessibility;
};

export function BreadcrumbsItemView({
  label,
  href,
  selected,
  target,
  accessibility,
}: BreadcrumbsItemViewProps) {
  return (
    <PrimerBreadcrumbs.Item
      href={href}
      selected={selected}
      target={target}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {label}
    </PrimerBreadcrumbs.Item>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders BreadcrumbsItemView. The crumb
 * has no ComponentId/Action row (navigation only, via `href`), so there is no buildChild/onClick
 * — resolved values pass straight through. `selected` is static "current page" state (no
 * interactive selection). `accessibility` carries a resolved (plain-string) label/description at
 * runtime; its inferred type still shows the nested DynamicString, so it is cast. Props are
 * passed explicitly (no spread): resolved props include extra binder setters.
 */
export const BreadcrumbsItemComponent = createComponentImplementation(
  BreadcrumbsItemApi,
  ({props}) => (
    <BreadcrumbsItemView
      label={props.label}
      href={props.href}
      selected={props.selected as boolean | undefined}
      target={props.target}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    />
  ),
);
