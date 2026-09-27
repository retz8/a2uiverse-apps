import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {renderChildList} from '../../shared/child-list.js';
import {PropertyApi} from './property.schema.js';

export function PropertyView({label, children}: {label: string; children?: ReactNode}) {
  return (
    <div className="lc-property">
      <span className="lc-property-label">{label}</span>
      <span className="lc-property-value">{children}</span>
    </div>
  );
}

export const Property = createComponentImplementation(PropertyApi, ({props, buildChild}) => (
  <PropertyView label={props.label ?? ''}>
    {renderChildList(props.children, buildChild)}
  </PropertyView>
));
