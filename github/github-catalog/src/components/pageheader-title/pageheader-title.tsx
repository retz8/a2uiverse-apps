import {PageHeader as PrimerPageHeader} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageHeaderTitleApi} from './pageheader-title.schema';

/** A resolved `hidden`: either a scalar boolean or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};

/** Resolved props: `text` is a plain string after the binder resolves the DynamicString.
 * Mirrors the shipped Heading leaf (content via a synthetic `text` prop). */
type PageHeaderTitleViewProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  hidden?: Responsive<boolean>;
};

export function PageHeaderTitleView({text, as, hidden}: PageHeaderTitleViewProps) {
  return (
    <PrimerPageHeader.Title as={as} hidden={hidden}>
      {text}
    </PrimerPageHeader.Title>
  );
}

export const PageHeaderTitleComponent = createComponentImplementation(
  PageHeaderTitleApi,
  ({props}) => <PageHeaderTitleView text={props.text} as={props.as} hidden={props.hidden} />,
);
