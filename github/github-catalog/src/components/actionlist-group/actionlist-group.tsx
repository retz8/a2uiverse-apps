import type {ComponentType, ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListGroupApi} from './actionlist-group.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children`; `auxiliaryText` resolves to a string. */
type ActionListGroupViewProps = {
  variant?: 'filled' | 'subtle';
  auxiliaryText?: string;
  selectionVariant?: 'single' | 'radio' | 'multiple' | false;
  role?: string;
  children?: ReactNode;
};

/**
 * Primer ActionList.Group spreads `HTMLAttributes` (a `role` typed as `AriaRole`). Cast it to a
 * plain component typed with exactly the prop surface we drive; the enums are schema-validated.
 */
const Group = PrimerActionList.Group as unknown as ComponentType<{
  variant?: 'filled' | 'subtle';
  auxiliaryText?: string;
  selectionVariant?: 'single' | 'radio' | 'multiple' | false;
  role?: string;
  children?: ReactNode;
}>;

export function ActionListGroupView({
  variant,
  auxiliaryText,
  selectionVariant,
  role,
  children,
}: ActionListGroupViewProps) {
  return (
    <Group
      variant={variant}
      auxiliaryText={auxiliaryText}
      selectionVariant={selectionVariant}
      role={role}
    >
      {children}
    </Group>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListGroupView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild` —
 *   the same container-slot convention as the root.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListGroupComponent = createComponentImplementation(
  ActionListGroupApi,
  ({props, buildChild}) => (
    <ActionListGroupView
      variant={props.variant}
      auxiliaryText={props.auxiliaryText}
      selectionVariant={props.selectionVariant}
      role={props.role}
    >
      {renderChildList(props.children, buildChild)}
    </ActionListGroupView>
  ),
);
