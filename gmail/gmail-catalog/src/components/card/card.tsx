import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {CardApi, type CardProps} from './card.schema.js';

type CardViewProps = Omit<CardProps, 'child'> & {children?: ReactNode};

export function CardView({variant = 'outlined', children}: CardViewProps) {
  return (
    <div className="gm-card" data-variant={variant}>
      {children}
    </div>
  );
}

export const Card = createComponentImplementation(CardApi, ({props, buildChild}) => (
  <CardView variant={props.variant}>{buildChild(props.child)}</CardView>
));
