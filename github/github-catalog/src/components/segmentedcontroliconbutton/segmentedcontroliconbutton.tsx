import {useContext, type ReactElement, type ReactNode} from 'react';
import {SegmentedControl as PrimerSegmentedControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SegmentedControlIconButtonApi} from './segmentedcontroliconbutton.schema';
import {SegmentSlotContext} from '../../shared/segmented-control-context';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};
type TooltipDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Resolved props: the ComponentId icon slot -> a built child; Dynamic* resolved to primitives;
 * `selected`/`onClick` are supplied by the parent through SegmentSlotContext, not the schema.
 */
type SegmentedControlIconButtonViewProps = {
  icon?: ReactNode;
  accessibility?: ResolvedAccessibility;
  description?: string;
  tooltipDirection?: TooltipDirection;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

export function SegmentedControlIconButtonView({
  icon,
  accessibility,
  description,
  tooltipDirection,
  disabled,
  selected,
  onClick,
}: SegmentedControlIconButtonViewProps) {
  return (
    <PrimerSegmentedControl.IconButton
      icon={icon as unknown as ReactElement}
      selected={selected}
      onClick={onClick}
      disabled={disabled}
      description={description}
      tooltipDirection={tooltipDirection}
      aria-label={accessibility?.label ?? ''}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SegmentedControlIconButtonView.
 * - `props.icon` (required) is built via buildChild into Primer's element slot (Primer accepts a
 *   ReactElement via react-is isElement).
 * - `accessibility.label` maps to Primer's required `aria-label`; `description`/`tooltipDirection`
 *   govern the tooltip.
 * - `selected`/`onSelect` come from the parent SegmentedControl via SegmentSlotContext. A disabled
 *   segment drops its click handler (mirroring Primer's parent, which skips disabled segments).
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SegmentedControlIconButtonComponent = createComponentImplementation(
  SegmentedControlIconButtonApi,
  ({props, buildChild}) => {
    const slot = useContext(SegmentSlotContext);
    return (
      <SegmentedControlIconButtonView
        icon={buildChild(props.icon)}
        accessibility={props.accessibility as ResolvedAccessibility | undefined}
        description={props.description}
        tooltipDirection={props.tooltipDirection}
        disabled={props.disabled}
        selected={slot?.selected}
        onClick={props.disabled ? undefined : slot?.onSelect}
      />
    );
  },
);
