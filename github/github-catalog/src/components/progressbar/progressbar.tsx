import {ProgressBar as PrimerProgressBar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ProgressBarApi, type ProgressBarBgRole} from './progressbar.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved segment: the binder resolves each nested DynamicNumber/DynamicString to a primitive. */
type ResolvedSegment = {progress?: number; bg?: ProgressBarBgRole; label?: string};

/** Resolved props: Dynamic* are resolved to primitives; `segments`/`accessibility` are resolved element-wise. */
type ProgressBarViewProps = {
  progress?: number;
  segments?: ResolvedSegment[];
  bg?: ProgressBarBgRole;
  barSize?: 'small' | 'default' | 'large';
  inline?: boolean;
  animated?: boolean;
  accessibility?: ResolvedAccessibility;
};

/** Map a semantic role to Primer's `<role>.emphasis` bg color token. */
function toBgToken(role?: ProgressBarBgRole): string | undefined {
  return role ? `${role}.emphasis` : undefined;
}

export function ProgressBarView({
  progress,
  segments,
  bg,
  barSize,
  inline,
  animated,
  accessibility,
}: ProgressBarViewProps) {
  // Multi-segment form: render each authored segment as a ProgressBar.Item. `progress` is
  // never passed here — Primer throws if children and a progress value both reach it.
  if (segments) {
    return (
      <PrimerProgressBar barSize={barSize} inline={inline} aria-label={accessibility?.label}>
        {segments.map((seg, i) => (
          <PrimerProgressBar.Item
            key={i}
            progress={seg.progress}
            bg={toBgToken(seg.bg)}
            aria-label={seg.label}
          />
        ))}
      </PrimerProgressBar>
    );
  }

  // Single-bar form.
  return (
    <PrimerProgressBar
      progress={progress}
      bg={toBgToken(bg)}
      barSize={barSize}
      inline={inline}
      animated={animated}
      aria-label={accessibility?.label}
    />
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders ProgressBarView.
 * - `props.segments` carries resolved (primitive) progress/label per element at runtime; its
 *   inferred type still shows the nested Dynamic values, so it is cast to the resolved shape
 *   (the binder maps only top-level props — arrays keep their unresolved static type).
 * - `props.accessibility` is likewise cast to its resolved plain-string shape.
 * Props are passed explicitly (no spread): resolved objects include extra binder setters.
 */
export const ProgressBarComponent = createComponentImplementation(ProgressBarApi, ({props}) => (
  <ProgressBarView
    progress={props.progress}
    segments={props.segments as ResolvedSegment[] | undefined}
    bg={props.bg}
    barSize={props.barSize}
    inline={props.inline}
    animated={props.animated}
    accessibility={props.accessibility as ResolvedAccessibility | undefined}
  />
));
