import {type ComponentType, type CSSProperties, type ReactNode} from 'react';
import {Popover as PrimerPopover} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PopoverContentApi} from './popover-content.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

type ContentWidth = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'auto';
type ContentHeight = 'small' | 'medium' | 'large' | 'xlarge' | 'auto' | 'fit-content';

/**
 * Primer's `Popover.Content` is the visible box: it stamps `data-width` / `data-height`, carries
 * the `PopoverContent` class (background / border / caret pseudo-elements / width / height CSS), and
 * wires `useOnOutsideClick`. Rendering it natively also pulls in the shared Popover stylesheet the
 * root's `data-caret` descendant selectors rely on. Its declared type is a plain `React.FC` without
 * `as` / `style`; cast it to the exact surface we drive. The caret arrows are positioned by the
 * ancestor `Popover`'s `data-caret`, so no caret prop lives here.
 */
const PopoverContent = PrimerPopover.Content as unknown as ComponentType<{
  width?: ContentWidth;
  height?: ContentHeight;
  onClickOutside?: (event: MouseEvent | TouchEvent) => void;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-description'?: string;
  children?: ReactNode;
}>;

/**
 * Resolved props: `width`/`height`/`overflow` pass through as scalars, `onClickOutside`
 * resolves to a `() => void` closure, `accessibility` to plain strings, and the ChildList arrives
 * as built `children`. `overflow` is applied as an inline style (Primer types but does not render
 * it), and `accessibility` maps onto `aria-*`.
 */
type PopoverContentViewProps = {
  width?: ContentWidth;
  height?: ContentHeight;
  overflow?: 'auto' | 'hidden' | 'scroll' | 'visible';
  onClickOutside?: () => void;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function PopoverContentView({
  width,
  height,
  overflow,
  onClickOutside,
  accessibility,
  children,
}: PopoverContentViewProps) {
  return (
    <PopoverContent
      width={width}
      height={height}
      // Primer's onClickOutside passes the DOM event our authored Action does not consume.
      onClickOutside={onClickOutside}
      style={overflow ? {overflow} : undefined}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {children}
    </PopoverContent>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PopoverContentView.
 * - `props.children` is a resolved `ChildList` built via `renderChildList` (the box content).
 * - `props.onClickOutside` resolves to a () => void closure → Primer's onClickOutside (the renderer
 *   routes event vs functionCall).
 * - `props.accessibility` carries a resolved (plain-string) label/description, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PopoverContentComponent = createComponentImplementation(
  PopoverContentApi,
  ({props, buildChild}) => (
    <PopoverContentView
      width={props.width}
      height={props.height}
      overflow={props.overflow}
      onClickOutside={props.onClickOutside}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </PopoverContentView>
  ),
);
