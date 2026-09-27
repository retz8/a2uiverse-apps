import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {StackApi, type StackProps} from './stack.schema.js';

type StackViewProps = Omit<StackProps, 'children'> & {children?: ReactNode};

export function StackView({
  direction = 'vertical',
  gap = 'sm',
  align,
  justify = 'start',
  wrap = false,
  padding = 'none',
  children,
}: StackViewProps) {
  return (
    <div
      className="gm-stack"
      data-direction={direction}
      data-gap={gap}
      data-align={align ?? (direction === 'horizontal' ? 'center' : 'stretch')}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      data-padding={padding}
    >
      {children}
    </div>
  );
}

export const Stack = createComponentImplementation(StackApi, ({props, buildChild}) => (
  <StackView
    direction={props.direction}
    gap={props.gap}
    align={props.align}
    justify={props.justify}
    wrap={props.wrap}
    padding={props.padding}
  >
    {renderChildList(props.children, buildChild)}
  </StackView>
));
