import type {ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {FieldApi} from './field.schema.js';

/** A small muted label over its value. */
export function FieldView({label, children}: {label: string; children?: ReactNode}) {
  return (
    <div className="circleci-field">
      <span className="circleci-field-label">{label}</span>
      <div className="circleci-field-value">{children}</div>
    </div>
  );
}

export const Field = createComponentImplementation(FieldApi, ({props, buildChild}) => (
  <FieldView label={props.label}>{buildChild(props.child)}</FieldView>
));
