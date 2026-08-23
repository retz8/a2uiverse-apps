import type {ElementType, ReactNode} from 'react';
import {IconButton as PrimerIconButton} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {IconButtonApi} from './iconbutton.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: Dynamic* are resolved to primitives, action -> onClick, the icon ComponentId -> a built child. */
type IconButtonViewProps = {
  variant?: 'default' | 'primary' | 'invisible' | 'danger' | 'link';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  inactive?: boolean;
  block?: boolean;
  loadingAnnouncement?: string;
  description?: string; // resolved DynamicString -> the tooltip's descriptive line.
  keybindingHint?: string | string[];
  tooltipDirection?: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  accessibility?: ResolvedAccessibility;
  onClick?: () => void;
  // The element-typed Primer icon slot, built from the required ComponentId child. Primer types it
  // ElementType, but ButtonBase renderModuleVisual accepts a ReactElement at runtime via react-is
  // isElement (same path Button's icon slot uses).
  icon?: ReactNode;
};

export function IconButtonView({
  variant,
  size,
  disabled,
  loading,
  inactive,
  block,
  loadingAnnouncement,
  description,
  keybindingHint,
  tooltipDirection,
  accessibility,
  onClick,
  icon,
}: IconButtonViewProps) {
  return (
    <PrimerIconButton
      icon={icon as unknown as ElementType}
      aria-label={accessibility?.label ?? ''}
      aria-description={accessibility?.description}
      description={description}
      keybindingHint={keybindingHint}
      tooltipDirection={tooltipDirection}
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      inactive={inactive}
      block={block}
      loadingAnnouncement={loadingAnnouncement}
      onClick={onClick}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders IconButtonView.
 * - `props.action` is resolved to a () => void closure (event vs functionCall routing is the
 *   renderer's job) -> passed as onClick.
 * - `props.icon` (required ComponentId) is built via buildChild and passed as the icon slot.
 * - `props.accessibility` carries resolved (plain-string) label/description at runtime; its
 *   inferred type still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const IconButtonComponent = createComponentImplementation(
  IconButtonApi,
  ({props, buildChild}) => (
    <IconButtonView
      variant={props.variant}
      size={props.size}
      disabled={props.disabled}
      loading={props.loading}
      inactive={props.inactive}
      block={props.block}
      loadingAnnouncement={props.loadingAnnouncement}
      description={props.description}
      keybindingHint={props.keybindingHint}
      tooltipDirection={props.tooltipDirection}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
      onClick={props.action}
      icon={buildChild(props.icon)}
    />
  ),
);
