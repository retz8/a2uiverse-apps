import type {ComponentType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListGroupHeadingApi} from './actionlist-groupheading.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children`; `auxiliaryText` resolves to a string. */
type ActionListGroupHeadingViewProps = {
  variant?: 'filled' | 'subtle';
  auxiliaryText?: string;
  visuallyHidden?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children?: ReactNode;
};

/** Cast to a plain component typed with exactly the prop surface we drive; enums are schema-validated. */
const GroupHeading = PrimerActionList.GroupHeading as unknown as ComponentType<{
  variant?: 'filled' | 'subtle';
  auxiliaryText?: string;
  visuallyHidden?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children?: ReactNode;
}>;

export function ActionListGroupHeadingView({
  variant,
  auxiliaryText,
  visuallyHidden,
  as,
  children,
}: ActionListGroupHeadingViewProps) {
  return (
    <GroupHeading
      variant={variant}
      auxiliaryText={auxiliaryText}
      visuallyHidden={visuallyHidden}
      as={as}
    >
      {children}
    </GroupHeading>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListGroupHeadingView.
 * - `props.children` (the label + optional trailing action) is a resolved `ChildList`;
 *   `renderChildList` builds each via `buildChild`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListGroupHeadingComponent = createComponentImplementation(
  ActionListGroupHeadingApi,
  ({props, buildChild}) => (
    <ActionListGroupHeadingView
      variant={props.variant}
      auxiliaryText={props.auxiliaryText}
      visuallyHidden={props.visuallyHidden}
      as={props.as}
    >
      {renderChildList(props.children, buildChild)}
    </ActionListGroupHeadingView>
  ),
);
