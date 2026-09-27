import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {StackApi, type StackProps} from './stack.schema.js';
import {renderChildList} from '../../shared/child-list.js';

type StackViewProps = Omit<StackProps, 'children'> & {children?: ReactNode};

/** A flex container; its layout is the stylesheet's, keyed on these attributes. */
export function StackView({direction, gap, align, justify, wrap, children}: StackViewProps) {
  return (
    <div
      className="circleci-stack"
      data-direction={direction ?? 'vertical'}
      data-gap={gap ?? 'small'}
      data-align={align ?? 'stretch'}
      data-justify={justify ?? 'start'}
      data-wrap={wrap ? 'true' : undefined}
    >
      {children}
    </div>
  );
}

/** Catalog entry: props passed explicitly — the resolved props also carry binder setters. */
export const Stack = createComponentImplementation(StackApi, ({props, buildChild}) => (
  <StackView
    direction={props.direction}
    gap={props.gap}
    align={props.align}
    justify={props.justify}
    wrap={props.wrap}
  >
    {renderChildList(props.children, buildChild)}
  </StackView>
));
