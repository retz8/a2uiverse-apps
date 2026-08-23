import type {ReactNode} from 'react';
import {useLayoutEffect, useRef} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderTitleAreaApi} from './pageheader-titlearea.schema.js';
import {renderChildList} from '../../shared/child-list.js';

/** A resolved value: either a scalar or Primer's `{narrow, regular, wide}` responsive map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

type TitleVariant = 'subtitle' | 'medium' | 'large';

/** Resolved props: ChildList arrives as built `children`; `variant`/`hidden` pass through. */
type PageHeaderTitleAreaViewProps = {
  variant?: Responsive<TitleVariant>;
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

const TITLE_SIZE_ATTR = 'data-title-size-variant';
const BREAKPOINTS = ['narrow', 'regular', 'wide'] as const;

/**
 * Primer sizes the title on the PageHeader *root* (`data-title-size-variant[-<breakpoint>]`),
 * which it derives by inspecting its direct React children for a TitleArea. Through the A2UI
 * renderer the root's direct child is a wrapper, so the hoist finds nothing and the title falls
 * back to inherited body size. The leaf stamps the attributes itself, mirroring Primer's
 * `getResponsiveAttributes`; Primer never sets them in this tree, so React leaves them alone.
 */
function stampTitleSize(root: Element, variant: Responsive<TitleVariant> | undefined) {
  for (const key of [TITLE_SIZE_ATTR, ...BREAKPOINTS.map(b => `${TITLE_SIZE_ATTR}-${b}`)]) {
    root.removeAttribute(key);
  }
  if (variant !== undefined && typeof variant === 'object') {
    for (const b of BREAKPOINTS) {
      if (variant[b] !== undefined) root.setAttribute(`${TITLE_SIZE_ATTR}-${b}`, variant[b]);
    }
    return;
  }
  root.setAttribute(TITLE_SIZE_ATTR, variant ?? 'medium');
}

export function PageHeaderTitleAreaView({variant, hidden, children}: PageHeaderTitleAreaViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current?.closest('[data-component="PageHeader"]');
    if (root) stampTitleSize(root, variant);
  }, [variant]);
  return (
    <PrimerPageHeader.TitleArea ref={ref} variant={variant} hidden={hidden}>
      {children}
    </PrimerPageHeader.TitleArea>
  );
}

export const PageHeaderTitleAreaComponent = createComponentImplementation(
  PageHeaderTitleAreaApi,
  ({props, buildChild}) => (
    <PageHeaderTitleAreaView variant={props.variant} hidden={props.hidden}>
      {renderChildList(props.children, buildChild)}
    </PageHeaderTitleAreaView>
  ),
);
