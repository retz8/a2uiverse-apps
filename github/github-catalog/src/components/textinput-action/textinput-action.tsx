import type {ComponentProps, FunctionComponent, ReactNode} from 'react';
import {TextInput as PrimerTextInput} from '@primer/react';
import type {IconProps} from '@primer/octicons-react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TextInputActionApi} from './textinput-action.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

type TooltipDirection = ComponentProps<typeof PrimerTextInput.Action>['tooltipDirection'];

/**
 * Resolved props: `action` -> onClick (() => void), `icon` -> a built child (ReactNode),
 * `disabled` -> the resolved boolean, plus the enum/accessibility passthroughs.
 */
type TextInputActionViewProps = {
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  tooltipDirection?: TooltipDirection;
  accessibility?: ResolvedAccessibility;
};

export function TextInputActionView({
  onClick,
  icon,
  disabled,
  tooltipDirection,
  accessibility,
}: TextInputActionViewProps) {
  return (
    <PrimerTextInput.Action
      // Primer's icon path renders the icon via IconButton, which accepts an already-built
      // element directly (react-is isElement); the type wants a component, so it is cast.
      icon={icon as unknown as FunctionComponent<IconProps> | undefined}
      disabled={disabled}
      tooltipDirection={tooltipDirection}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
      onClick={onClick}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TextInputActionView.
 * - `props.action` is resolved to a () => void closure (the renderer routes event vs
 *   functionCall) -> passed as onClick.
 * - `props.icon` (optional) is resolved via buildChild, guarded on presence.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TextInputActionComponent = createComponentImplementation(
  TextInputActionApi,
  ({props, buildChild}) => (
    <TextInputActionView
      onClick={props.action}
      icon={props.icon ? buildChild(props.icon) : undefined}
      disabled={props.disabled}
      tooltipDirection={props.tooltipDirection}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    />
  ),
);
