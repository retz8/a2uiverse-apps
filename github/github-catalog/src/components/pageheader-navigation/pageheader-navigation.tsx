import type {ReactNode} from 'react';
import {useRef} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderNavigationApi} from './pageheader-navigation.schema.js';
import {renderChildList} from '../../shared/child-list.js';
import type {Responsive} from '../../shared/pageheader-root.js';
import {
  hiddenAttributes,
  ownedAttributeNames,
  usePageHeaderRootAttributes,
} from '../../shared/pageheader-root.js';

const OWNED = ['data-has-nav', ...ownedAttributeNames('nav-hidden')];

/** Resolved props: ChildList arrives as built `children`; `aria-*` are plain strings post-binder. */
type PageHeaderNavigationViewProps = {
  as?: 'nav' | 'div';
  ariaLabel?: string;
  ariaLabelledby?: string;
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderNavigationView({
  as,
  ariaLabel,
  ariaLabelledby,
  hidden,
  children,
}: PageHeaderNavigationViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Navigation presence and visibility live on the PageHeader root (see shared/pageheader-root).
  usePageHeaderRootAttributes(
    ref,
    OWNED,
    {'data-has-nav': '', ...hiddenAttributes('nav-hidden', hidden)},
    [hidden],
  );
  // Primer's Navigation forwards no ref; a contents-only anchor locates the root without
  // disturbing the header grid (the Navigation stays the grid item).
  return (
    <div ref={ref} style={{display: 'contents'}}>
      <PrimerPageHeader.Navigation
        as={as}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        hidden={hidden}
      >
        {children}
      </PrimerPageHeader.Navigation>
    </div>
  );
}

export const PageHeaderNavigationComponent = createComponentImplementation(
  PageHeaderNavigationApi,
  ({props, buildChild}) => (
    <PageHeaderNavigationView
      as={props.as}
      ariaLabel={props['aria-label']}
      ariaLabelledby={props['aria-labelledby']}
      hidden={props.hidden}
    >
      {renderChildList(props.children, buildChild)}
    </PageHeaderNavigationView>
  ),
);
