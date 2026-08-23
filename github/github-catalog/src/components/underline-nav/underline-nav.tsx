import type {ReactNode} from 'react';
import {UnderlineNav as PrimerUnderlineNav} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {UnderlineNavApi} from './underline-nav.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: `children` arrives as a built `ChildList`; `aria-label`/`loadingCounters` resolve to primitives. */
type UnderlineNavViewProps = {
  ariaLabel: string;
  loadingCounters?: boolean;
  variant?: 'inset' | 'flush';
  children?: ReactNode;
};

export function UnderlineNavView({
  ariaLabel,
  loadingCounters,
  variant,
  children,
}: UnderlineNavViewProps) {
  return (
    <PrimerUnderlineNav aria-label={ariaLabel} loadingCounters={loadingCounters} variant={variant}>
      {children}
    </PrimerUnderlineNav>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders UnderlineNavView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild`. Each `UnderlineNav.Item`
 *   self-manages its width/underline via `UnderlineNavContext`, so no prop-cloning bridge is needed.
 * - `props['aria-label']` resolves to a plain string and maps to the nav landmark's accessible name;
 *   `loadingCounters` resolves to a plain boolean; `variant` is a static enum pass-through.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const UnderlineNavComponent = createComponentImplementation(
  UnderlineNavApi,
  ({props, buildChild}) => (
    <UnderlineNavView
      ariaLabel={props['aria-label']}
      loadingCounters={props.loadingCounters as boolean | undefined}
      variant={props.variant}
    >
      {renderChildList(props.children, buildChild)}
    </UnderlineNavView>
  ),
);
