import {useContext, type ReactElement, type ReactNode} from 'react';
import {SegmentedControl as PrimerSegmentedControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SegmentedControlButtonApi} from './segmentedcontrolbutton.schema';
import {SegmentSlotContext} from '../../shared/segmented-control-context';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/**
 * Resolved props: Dynamic* are resolved to primitives, the ComponentId leadingVisual slot -> a
 * built child; `selected`/`onClick` are supplied by the parent through SegmentSlotContext, not the
 * schema.
 */
type SegmentedControlButtonViewProps = {
  label?: string;
  count?: string; // Primer accepts number | string; the binder only ever resolves DynamicString to a string here.
  disabled?: boolean;
  accessibility?: ResolvedAccessibility;
  leadingVisual?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

export function SegmentedControlButtonView({
  label,
  count,
  disabled,
  accessibility,
  leadingVisual,
  selected,
  onClick,
}: SegmentedControlButtonViewProps) {
  return (
    <PrimerSegmentedControl.Button
      selected={selected}
      onClick={onClick}
      disabled={disabled}
      count={count}
      leadingVisual={leadingVisual as ReactElement | undefined}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {label ?? ''}
    </PrimerSegmentedControl.Button>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SegmentedControlButtonView.
 * - `props.label` is the resolved text label; `props.leadingVisual` (optional) is built via
 *   buildChild into Primer's element slot.
 * - `selected`/`onSelect` come from the parent SegmentedControl via SegmentSlotContext. A disabled
 *   segment drops its click handler (mirroring Primer's parent, which skips disabled segments).
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SegmentedControlButtonComponent = createComponentImplementation(
  SegmentedControlButtonApi,
  ({props, buildChild}) => {
    const slot = useContext(SegmentSlotContext);
    return (
      <SegmentedControlButtonView
        label={props.label}
        count={props.count}
        disabled={props.disabled}
        accessibility={props.accessibility as ResolvedAccessibility | undefined}
        leadingVisual={props.leadingVisual ? buildChild(props.leadingVisual) : undefined}
        selected={slot?.selected}
        onClick={props.disabled ? undefined : slot?.onSelect}
      />
    );
  },
);
