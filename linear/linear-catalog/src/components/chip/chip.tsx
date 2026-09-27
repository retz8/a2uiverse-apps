import type {CSSProperties, ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ChipApi} from './chip.schema.js';

/** Only a hex colour becomes a dot; anything else a vendor string carries is dropped. */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

type ChipViewProps = {label: string; color?: string; leading?: ReactNode};

export function ChipView({label, color, leading}: ChipViewProps) {
  const dot = color && HEX.test(color.trim()) ? color.trim() : undefined;
  return (
    <span className="lc-chip">
      {leading ? (
        <span className="lc-chip-leading">{leading}</span>
      ) : dot ? (
        <span className="lc-chip-dot" style={{background: dot} as CSSProperties} aria-hidden />
      ) : null}
      <span className="lc-chip-label">{label}</span>
    </span>
  );
}

export const Chip = createComponentImplementation(ChipApi, ({props, buildChild}) => (
  <ChipView
    label={props.label ?? ''}
    color={props.color || undefined}
    leading={props.leading ? buildChild(props.leading) : undefined}
  />
));
