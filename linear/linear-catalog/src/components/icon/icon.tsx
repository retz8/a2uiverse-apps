import {createComponentImplementation} from '@a2ui/react/v0_9';
import {IconApi, type IconName} from './icon.schema.js';

/** A circle as a path, so every glyph is one `d`. */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}a${r} ${r} 0 1 1-${2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0`;

/** Drawn for this catalog on a 14-unit grid, stroked in the current colour. */
const PATHS: Record<IconName, string> = {
  'arrow-right': 'M2.5 7h9M8 3.5 11.5 7 8 10.5',
  branch: [
    circle(4, 3, 1.5),
    circle(4, 11, 1.5),
    circle(10, 4.5, 1.5),
    'M4 4.5v5M10 6c0 2.25-2 3-6 3.5',
  ].join(''),
  'pull-request': [
    circle(4, 3, 1.5),
    circle(4, 11, 1.5),
    circle(10, 11, 1.5),
    'M4 4.5v5M10 9.5V6a2 2 0 0 0-2-2H6.5M8 2.5 6.5 4 8 5.5',
  ].join(''),
  link: 'M6 8a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 8 2.5l-.75.75M8 6a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 6 11.5l.75-.75',
  plus: 'M7 2.5v9M2.5 7h9',
  check: 'M2.75 7.25 5.5 10l5.75-6',
};

export function IconView({name, label}: {name: IconName; label?: string}) {
  return (
    <svg
      className="lc-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export const Icon = createComponentImplementation(IconApi, ({props}) => (
  <IconView name={props.name} label={props.label || undefined} />
));
