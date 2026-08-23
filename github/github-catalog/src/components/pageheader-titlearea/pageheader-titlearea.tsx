import type {ReactNode} from 'react';
import {useRef} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderTitleAreaApi} from './pageheader-titlearea.schema.js';
import {renderChildList} from '../../shared/child-list.js';
import type {Responsive} from '../../shared/pageheader-root.js';
import {
  ownedAttributeNames,
  responsiveAttributes,
  usePageHeaderRootAttributes,
} from '../../shared/pageheader-root.js';

/** Resolved props: ChildList arrives as built `children`; `variant`/`hidden` pass through. */
type PageHeaderTitleAreaViewProps = {
  variant?: Responsive<'subtitle' | 'medium' | 'large'>;
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

const OWNED = ownedAttributeNames('title-size-variant');

export function PageHeaderTitleAreaView({variant, hidden, children}: PageHeaderTitleAreaViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The title size lives on the PageHeader root (see shared/pageheader-root).
  usePageHeaderRootAttributes(
    ref,
    OWNED,
    responsiveAttributes('title-size-variant', variant ?? 'medium'),
    [variant],
  );
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
