import type React from 'react';
import {ToggleSwitch as PrimerToggleSwitch} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ToggleSwitchApi} from './toggleswitch.schema';

/** Resolved accessibility: the nested DynamicStrings are plain strings post-binder. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* are resolved to primitives; the flip drives `onToggle`. */
type ToggleSwitchViewProps = {
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium';
  statusLabelPosition?: 'start' | 'end';
  buttonLabelOn?: string;
  buttonLabelOff?: string;
  loadingLabel?: string;
  loadingLabelDelay?: number;
  accessibility?: ResolvedAccessibility;
  /**
   * Called with the next checked value when the user flips the switch. In controlled mode
   * (which A2UI always is — `checked` is required and bound) Primer routes the user's flip
   * through `onClick`, not `onChange` (the latter is an effect that merely re-announces the
   * controlled value). So the flip signal is wired from `onClick`.
   */
  onToggle?: (nextChecked: boolean) => void;
};

// Primer types `aria-labelledby` as REQUIRED — its normal accessible-name channel is a
// cross-DOM id reference. A2UI has no such references, so the adapter names the switch
// directly via `aria-label`; relax the required prop to allow that.
const ToggleSwitchControl = PrimerToggleSwitch as React.ComponentType<
  Omit<React.ComponentProps<typeof PrimerToggleSwitch>, 'aria-labelledby'> & {
    'aria-labelledby'?: string;
  }
>;

export function ToggleSwitchView({
  checked,
  disabled,
  loading,
  size,
  statusLabelPosition,
  buttonLabelOn,
  buttonLabelOff,
  loadingLabel,
  loadingLabelDelay,
  accessibility,
  onToggle,
}: ToggleSwitchViewProps) {
  return (
    <ToggleSwitchControl
      checked={checked}
      disabled={disabled}
      loading={loading}
      size={size}
      statusLabelPosition={statusLabelPosition}
      buttonLabelOn={buttonLabelOn}
      buttonLabelOff={buttonLabelOff}
      loadingLabel={loadingLabel}
      loadingLabelDelay={loadingLabelDelay}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
      onClick={
        onToggle
          ? () => {
              // A disabled/loading switch does not toggle (Primer's own click handler
              // doesn't guard this — it relies on CSS pointer-events, which don't apply
              // outside a browser — so guard the write-back here).
              if (disabled || loading) return;
              onToggle(!checked);
            }
          : undefined
      }
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ToggleSwitchView.
 * - `checked` is two-way bound: on flip we write the new value back through the binder's
 *   auto-generated `setChecked` setter (the optimistic local write — instant, no round trip),
 *   then fire the optional `action` (the flip-time channel to the agent or a local function).
 *   A server write to the same bound path stays authoritative and can override the optimism.
 * - `props.accessibility` carries a resolved (plain-string) label at runtime; its inferred type
 *   still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ToggleSwitchComponent = createComponentImplementation(ToggleSwitchApi, ({props}) => (
  <ToggleSwitchView
    checked={props.checked}
    disabled={props.disabled}
    loading={props.loading}
    size={props.size}
    statusLabelPosition={props.statusLabelPosition}
    buttonLabelOn={props.buttonLabelOn}
    buttonLabelOff={props.buttonLabelOff}
    loadingLabel={props.loadingLabel}
    loadingLabelDelay={props.loadingLabelDelay}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
    onToggle={nextChecked => {
      props.setChecked(nextChecked);
      props.action?.();
    }}
  />
));
