import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {StackApi, type StackProps} from './stack.schema.js';

type StackViewProps = Omit<StackProps, 'children'> & {children?: ReactNode};

export function StackView({
  direction,
  gap,
  align,
  justify,
  wrap,
  padding,
  children,
}: StackViewProps) {
  return (
    <div
      className="lc-stack"
      data-direction={direction ?? 'vertical'}
      data-gap={gap ?? 's'}
      data-align={align ?? 'stretch'}
      data-justify={justify ?? 'start'}
      data-wrap={wrap ? 'wrap' : undefined}
      data-padding={padding ?? 'none'}
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
