import {ICON_PATHS, type IconName} from '../icons.generated.js';

/** A Material Symbols glyph as inline SVG, sized by its container and drawn in `currentColor`. */
export function Glyph({name, filled = false}: {name: IconName; filled?: boolean}) {
  const paths = ICON_PATHS[name];
  return (
    <svg
      className="gc-glyph"
      viewBox="0 -960 960 960"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d={filled ? paths.filled : paths.outlined} />
    </svg>
  );
}
