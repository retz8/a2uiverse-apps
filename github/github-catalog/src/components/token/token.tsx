import type {ElementType, ReactNode} from 'react';
import {Token as PrimerToken} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TokenApi} from './token.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* are resolved to primitives, removeAction -> onRemove, leadingVisual -> built child. */
type TokenViewProps = {
  text: string;
  as?: 'span' | 'button' | 'a';
  onRemove?: () => void;
  hideRemoveButton?: boolean;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  accessibility?: ResolvedAccessibility;
  // The built ComponentId child. Primer renders leadingVisual as an element type
  // (`<LeadingVisual />`), so the View wraps the built node in a component below.
  leadingVisual?: ReactNode;
};

export function TokenView({
  text,
  as,
  onRemove,
  hideRemoveButton,
  isSelected,
  size,
  disabled,
  accessibility,
  leadingVisual,
}: TokenViewProps) {
  // Primer instantiates leadingVisual as `jsx(LeadingVisual, {})`; wrap the built node in a
  // zero-prop component so the resolved child renders in the leading slot.
  const LeadingVisual: ElementType | undefined = leadingVisual
    ? () => <>{leadingVisual}</>
    : undefined;
  return (
    <PrimerToken
      as={as}
      text={text}
      onRemove={onRemove}
      hideRemoveButton={hideRemoveButton}
      isSelected={isSelected}
      size={size}
      disabled={disabled}
      leadingVisual={LeadingVisual}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TokenView.
 * - `props.removeAction` (optional) is resolved to a () => void closure (the renderer routes
 *   event vs functionCall) -> passed as onRemove; omitting it renders no remove button.
 * - `props.leadingVisual` (optional ComponentId) is built via buildChild, guarded on presence.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TokenComponent = createComponentImplementation(TokenApi, ({props, buildChild}) => (
  <TokenView
    text={props.text}
    as={props.as}
    onRemove={props.removeAction}
    hideRemoveButton={props.hideRemoveButton}
    isSelected={props.isSelected}
    size={props.size}
    disabled={props.disabled}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
    leadingVisual={props.leadingVisual ? buildChild(props.leadingVisual) : undefined}
  />
));
