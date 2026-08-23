import type {ElementType, ReactNode} from 'react';
import {Stack as PrimerStack} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StackApi} from './stack.schema';
import {renderChildList} from '../../shared/child-list';

/** A resolved scale prop: either a scalar value or Primer's `{narrow, regular, wide}` responsive map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};
type Spacing = 'none' | 'tight' | 'condensed' | 'cozy' | 'normal' | 'spacious';

/** Resolved props: ChildList arrives as built `children`; scale props pass through (scalar or map). */
type StackViewProps = {
  as?: ElementType;
  direction?: Responsive<'horizontal' | 'vertical'>;
  gap?: Responsive<Spacing>;
  align?: Responsive<'stretch' | 'start' | 'center' | 'end' | 'baseline'>;
  justify?: Responsive<'start' | 'center' | 'end' | 'space-between' | 'space-evenly'>;
  wrap?: Responsive<'wrap' | 'nowrap'>;
  padding?: Responsive<Spacing>;
  paddingBlock?: Responsive<Spacing>;
  paddingInline?: Responsive<Spacing>;
  children?: ReactNode;
};

export function StackView({
  as,
  direction,
  gap,
  align,
  justify,
  wrap,
  padding,
  paddingBlock,
  paddingInline,
  children,
}: StackViewProps) {
  return (
    <PrimerStack
      as={as}
      direction={direction}
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap}
      padding={padding}
      paddingBlock={paddingBlock}
      paddingInline={paddingInline}
    >
      {children}
    </PrimerStack>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders StackView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild` as direct flex children.
 * - The scale props resolve as STATIC pass-throughs (scalar or responsive map) — forwarded to
 *   Primer, which handles the CSS. Props are passed explicitly (no spread): resolved props
 *   include extra binder setters.
 */
export const StackComponent = createComponentImplementation(StackApi, ({props, buildChild}) => (
  <StackView
    as={props.as}
    direction={props.direction}
    gap={props.gap}
    align={props.align}
    justify={props.justify}
    wrap={props.wrap}
    padding={props.padding}
    paddingBlock={props.paddingBlock}
    paddingInline={props.paddingInline}
  >
    {renderChildList(props.children, buildChild)}
  </StackView>
));
