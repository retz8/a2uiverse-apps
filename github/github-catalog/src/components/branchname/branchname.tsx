import {BranchName as PrimerBranchName} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {BranchNameApi, type BranchNameProps} from './branchname.schema';

/**
 * Resolved props: `text` and `href` are plain strings after the binder resolves the
 * DynamicStrings. `text` renders as the label (children); `href` is the anchor's
 * navigation target; `as` selects the host element (anchor by default, span when the
 * reference is contextual).
 */
type BranchNameViewProps = Omit<BranchNameProps, 'text' | 'href'> & {
  text: string;
  href?: string;
};

export function BranchNameView({text, href, as}: BranchNameViewProps) {
  return (
    <PrimerBranchName as={as} href={href}>
      {text}
    </PrimerBranchName>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders BranchNameView.
 * BranchName has no ComponentId/Action row, so there is no buildChild/onClick —
 * resolved values pass straight through. Props are passed explicitly (no spread):
 * resolved props include extra binder setters that would leak as unknown props.
 */
export const BranchNameComponent = createComponentImplementation(BranchNameApi, ({props}) => (
  <BranchNameView text={props.text} href={props.href} as={props.as} />
));
