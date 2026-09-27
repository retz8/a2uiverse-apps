import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PanelApi} from './panel.schema.js';

export function PanelView({
  padding,
  children,
}: {
  padding?: 'none' | 'normal';
  children?: ReactNode;
}) {
  return (
    <section className="lc-panel" data-padding={padding ?? 'normal'}>
      {children}
    </section>
  );
}

export const Panel = createComponentImplementation(PanelApi, ({props, buildChild}) => (
  <PanelView padding={props.padding}>{buildChild(props.child)}</PanelView>
));
