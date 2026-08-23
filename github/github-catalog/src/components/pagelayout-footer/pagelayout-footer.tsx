import type {ReactNode} from 'react';
import {PageLayout as PrimerPageLayout} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageLayoutFooterApi} from './pagelayout-footer.schema';
import {renderChildList} from '../../shared/child-list';

type Spacing = 'none' | 'condensed' | 'normal';
type Divider =
  | 'none'
  | 'line'
  | {narrow?: 'none' | 'line' | 'filled'; regular?: 'none' | 'line'; wide?: 'none' | 'line'};
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: ChildList arrives as built `children`; scale/config props pass through. */
type PageLayoutFooterViewProps = {
  padding?: Spacing;
  divider?: Divider;
  hidden?: Responsive<boolean>;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function PageLayoutFooterView({
  padding,
  divider,
  hidden,
  accessibility,
  children,
}: PageLayoutFooterViewProps) {
  return (
    <PrimerPageLayout.Footer
      padding={padding}
      divider={divider}
      hidden={hidden}
      aria-label={accessibility?.label}
    >
      {children}
    </PrimerPageLayout.Footer>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PageLayoutFooterView.
 * - `props.children` is a resolved `ChildList`, built via `renderChildList`.
 * - `padding`/`divider`/`hidden` resolve as static pass-throughs; `accessibility` carries resolved
 *   (plain-string) label/description, so it is cast to the resolved shape (only `label` is forwarded
 *   — Primer's contentinfo landmark accepts `aria-label`/`aria-labelledby`, not `aria-description`).
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PageLayoutFooterComponent = createComponentImplementation(
  PageLayoutFooterApi,
  ({props, buildChild}) => (
    <PageLayoutFooterView
      padding={props.padding}
      divider={props.divider}
      hidden={props.hidden}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </PageLayoutFooterView>
  ),
);
