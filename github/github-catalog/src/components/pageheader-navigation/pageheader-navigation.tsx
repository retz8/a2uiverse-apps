import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderNavigationApi} from './pageheader-navigation.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

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
  return (
    <PrimerPageHeader.Navigation
      as={as}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      hidden={hidden}
    >
      {children}
    </PrimerPageHeader.Navigation>
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
