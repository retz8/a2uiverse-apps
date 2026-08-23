import {type ElementType, type ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PopoverApi} from './popover.schema';
import {renderChildList} from '../../shared/child-list';

/** The 12 caret positions (Primer's `CaretPosition`); the code default is `"top"`. */
type CaretPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'left-bottom'
  | 'left-top'
  | 'right-bottom'
  | 'right-top';

/**
 * Resolved props: `open`/`relative` resolve to plain booleans, `caret`/`as` pass through as
 * scalars, and the ChildList arrives as built `children`.
 */
type PopoverViewProps = {
  caret?: CaretPosition;
  open?: boolean;
  relative?: boolean;
  as?: 'div' | 'section' | 'aside';
  children?: ReactNode;
};

/**
 * The positioning wrapper, rendered directly on the chosen `as` element (Primer's `Popover` is a
 * hardcoded `<div>` that ignores `as`, so the adapter owns the polymorphic host). Its DOM mirrors
 * Primer's `Popover` faithfully — `data-component` / `data-open` / `data-relative` / `data-caret`
 * — and its positioning styles mirror `Popover.module.css` (`display:none`, `position:absolute`,
 * `z-index:100`; `[data-open]`→`display:block`; `[data-relative]`→`position:relative`) so no
 * Primer root class is needed. The child `Popover.Content` (rendered natively) is a descendant of
 * this element, so the `data-caret` set here drives its caret pseudo-elements via Primer's
 * `:where([data-caret=…]) .PopoverContent` selectors and pulls the shared Popover stylesheet in.
 */
export function PopoverView({caret, open, relative, as, children}: PopoverViewProps) {
  const Tag = (as ?? 'div') as ElementType;
  // Primer treats a falsy `open` as hidden (`open ? "" : undefined`); Popover defaults CLOSED.
  const isOpen = open ?? false;
  return (
    <Tag
      data-component="Popover"
      data-open={isOpen ? '' : undefined}
      data-relative={relative ? '' : undefined}
      data-caret={caret ?? 'top'}
      style={{
        display: isOpen ? 'block' : 'none',
        position: relative ? 'relative' : 'absolute',
        zIndex: 100,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PopoverView.
 * - `props.children` is a resolved `ChildList` built via `renderChildList` (the single content box).
 * - `props.open` resolves to a boolean (two-way bound when a path is authored; the binder's
 *   `setOpen` is unused here — the root carries no dismissal gesture).
 * - `props.relative`/`props.caret`/`props.as` resolve as STATIC pass-throughs.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PopoverComponent = createComponentImplementation(PopoverApi, ({props, buildChild}) => (
  <PopoverView caret={props.caret} open={props.open} relative={props.relative} as={props.as}>
    {renderChildList(props.children, buildChild)}
  </PopoverView>
));
