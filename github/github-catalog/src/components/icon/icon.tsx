import * as octicons from '@primer/octicons-react';
import type {Icon as OcticonComponent} from '@primer/octicons-react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {IconApi, ICON_FILLS} from './icon.schema';

/** The octicons namespace as a name-keyed lookup of icon components. */
const OCTICONS = octicons as unknown as Record<string, OcticonComponent | undefined>;

/**
 * Resolve a catalog `name` (kebab-case, minus the `Icon` suffix) back to its
 * `@primer/octicons-react` export: `git-pull-request` -> `GitPullRequestIcon`. The
 * `name` enum is generated from that same export list, so every enum value resolves
 * (asserted by the mapping-totality render test).
 */
export function nameToExport(name: string): string {
  return (
    name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Icon'
  );
}

/** Resolved accessibility: the nested DynamicString is a plain string post-binder. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: `fill` is the semantic role; `accessibility.label` -> aria-label. */
type IconViewProps = {
  name: string;
  size?: 'small' | 'medium' | 'large';
  fill?: (typeof ICON_FILLS)[number];
  accessibility?: ResolvedAccessibility;
};

export function IconView({name, size, fill, accessibility}: IconViewProps) {
  // A live agent can emit a non-string name (e.g. a data binding where the enum
  // expects a literal); render nothing rather than crash the whole surface.
  if (typeof name !== 'string') return null;
  const Glyph = OCTICONS[nameToExport(name)];
  if (!Glyph) return null;
  // `default` inherits the surrounding text color (currentColor); every other role maps
  // to its theme-aware Primer functional foreground token.
  const svgFill = fill && fill !== 'default' ? `var(--fgColor-${fill})` : undefined;
  // A label makes octicons expose role="img"; its absence renders the icon aria-hidden.
  return <Glyph size={size} fill={svgFill} aria-label={accessibility?.label} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders IconView. Icon has no
 * ComponentId/Action row, so there is no buildChild/onClick — resolved values pass
 * straight through. `accessibility` carries a resolved (plain-string) label at runtime;
 * its inferred type still shows the nested DynamicString, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const IconComponent = createComponentImplementation(IconApi, ({props}) => (
  <IconView
    name={props.name}
    size={props.size}
    fill={props.fill}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
  />
));
