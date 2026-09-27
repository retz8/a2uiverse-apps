import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SurfaceApi, type SurfaceProps} from './surface.schema.js';

type SurfaceViewProps = Omit<SurfaceProps, 'child'> & {children?: ReactNode};

export function SurfaceView({
  container = 'lowest',
  shape = 'large',
  padding = 'medium',
  elevation = 'level0',
  children,
}: SurfaceViewProps) {
  return (
    <div
      className="gm-surface"
      data-container={container}
      data-shape={shape}
      data-padding={padding}
      data-elevation={elevation}
    >
      {children}
    </div>
  );
}

export const Surface = createComponentImplementation(SurfaceApi, ({props, buildChild}) => (
  <SurfaceView
    container={props.container}
    shape={props.shape}
    padding={props.padding}
    elevation={props.elevation}
  >
    {buildChild(props.child)}
  </SurfaceView>
));
