import type {ReactNode} from 'react';
import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderTitleAreaApi} from './pageheader-titlearea.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved value: either a scalar or Primer's `{narrow, regular, wide}` responsive map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: ChildList arrives as built `children`; `variant`/`hidden` pass through. */
type PageHeaderTitleAreaViewProps = {
  variant?: Responsive<'subtitle' | 'medium' | 'large'>;
  hidden?: Responsive<boolean>;
  children?: ReactNode;
};

export function PageHeaderTitleAreaView({variant, hidden, children}: PageHeaderTitleAreaViewProps) {
  return (
    <PrimerPageHeader.TitleArea variant={variant} hidden={hidden}>
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
