import {IssueLabelToken as PrimerIssueLabelToken} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {IssueLabelTokenApi} from './issuelabeltoken.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* are resolved to primitives, removeAction -> onRemove. */
type IssueLabelTokenViewProps = {
  text: string;
  fillColor?: string;
  as?: 'span' | 'button' | 'a';
  onRemove?: () => void;
  hideRemoveButton?: boolean;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  accessibility?: ResolvedAccessibility;
};

/**
 * Normalize a bound fill color for Primer's color parser, which throws on anything
 * it cannot parse. GitHub's API ships label colors as bare hex (`0e8a16`), so that
 * form gets its `#` restored; a non-string (an unresolved binding) is dropped so
 * the token falls back to its default fill.
 */
function normalizeFillColor(fillColor: unknown): string | undefined {
  if (typeof fillColor !== 'string') return undefined;
  return /^([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(fillColor)
    ? `#${fillColor}`
    : fillColor;
}

export function IssueLabelTokenView({
  text,
  fillColor,
  as,
  onRemove,
  hideRemoveButton,
  isSelected,
  size,
  disabled,
  accessibility,
}: IssueLabelTokenViewProps) {
  return (
    <PrimerIssueLabelToken
      as={as}
      text={text}
      fillColor={normalizeFillColor(fillColor)}
      onRemove={onRemove}
      hideRemoveButton={hideRemoveButton}
      isSelected={isSelected}
      size={size}
      disabled={disabled}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders IssueLabelTokenView.
 * - `props.removeAction` (optional) is resolved to a () => void closure -> passed as onRemove;
 *   omitting it renders no remove button.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const IssueLabelTokenComponent = createComponentImplementation(
  IssueLabelTokenApi,
  ({props}) => (
    <IssueLabelTokenView
      text={props.text}
      fillColor={props.fillColor}
      as={props.as}
      onRemove={props.removeAction}
      hideRemoveButton={props.hideRemoveButton}
      isSelected={props.isSelected}
      size={props.size}
      disabled={props.disabled}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    />
  ),
);
