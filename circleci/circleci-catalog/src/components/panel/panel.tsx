import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PanelApi} from './panel.schema.js';

type PanelViewProps = {
  padding?: 'none' | 'small' | 'medium' | 'large';
  tone?: 'default' | 'muted' | 'danger';
  children?: ReactNode;
};

/** The bordered panel: `muted` a quiet fill, `danger` a failure's red border and pale fill. */
export function PanelView({padding, tone, children}: PanelViewProps) {
  return (
    <div
      className="circleci-panel"
      data-padding={padding ?? 'medium'}
      data-tone={tone ?? 'default'}
    >
      {children}
    </div>
  );
}

export const Panel = createComponentImplementation(PanelApi, ({props, buildChild}) => (
  <PanelView padding={props.padding} tone={props.tone}>
    {buildChild(props.child)}
  </PanelView>
));
