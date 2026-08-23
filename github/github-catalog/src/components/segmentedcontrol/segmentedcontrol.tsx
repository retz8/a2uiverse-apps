import type {ReactNode} from 'react';
import {SegmentedControl as PrimerSegmentedControl} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SegmentedControlApi} from './segmentedcontrol.schema';
import {SegmentSlotContext} from '../../shared/segmented-control-context';

/** A resolved responsive prop: either a scalar value or Primer's `{narrow, regular, wide}` map. */
type Responsive<T> = T | {narrow?: T; regular?: T; wide?: T};
type VariantMode = 'default' | 'hideLabels' | 'dropdown';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** A resolved `ChildList` entry: a static id, or a `{id, basePath}` dynamic-template expansion. */
type ResolvedChildRef = string | {id: string; basePath?: string};

/** Resolved props: the ChildList arrives as built `children`; the rest pass through to Primer. */
type SegmentedControlViewProps = {
  fullWidth?: Responsive<boolean>;
  size?: 'small' | 'medium';
  variant?: 'default' | {narrow?: VariantMode; regular?: VariantMode; wide?: VariantMode};
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function SegmentedControlView({
  fullWidth,
  size,
  variant,
  accessibility,
  children,
}: SegmentedControlViewProps) {
  return (
    <PrimerSegmentedControl
      fullWidth={fullWidth}
      size={size}
      variant={variant}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {children}
    </PrimerSegmentedControl>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SegmentedControlView.
 *
 * Selection is centralized on `selectedIndex` (defaulting to 0 when unset, as Primer does). Each
 * child is built via `buildChild` and wrapped in a `SegmentSlotContext.Provider` carrying that
 * segment's `selected` flag and its `onSelect` handler — the channel the segment leaves read to
 * inject `selected`/`onClick` into Primer (the a2ui `DeferredChild` wrapper blocks Primer's own
 * child-cloning from reaching the real segment). `onSelect` performs the intrinsic optimistic
 * two-way write (`setSelectedIndex`, the binder's auto-generated setter — a no-op for a literal
 * `selectedIndex`) BEFORE firing the optional `action`, so an event's `context.selectedIndex`
 * carries the new index. Props are passed explicitly (no spread): resolved props include extra
 * binder setters.
 */
export const SegmentedControlComponent = createComponentImplementation(
  SegmentedControlApi,
  ({props, buildChild}) => {
    const selectedIndex = (props.selectedIndex as number | undefined) ?? 0;
    const setSelectedIndex = (props as {setSelectedIndex?: (value: number) => void})
      .setSelectedIndex;
    const childRefs: ResolvedChildRef[] = Array.isArray(props.children)
      ? (props.children as ResolvedChildRef[])
      : [];

    return (
      <SegmentedControlView
        fullWidth={props.fullWidth}
        size={props.size}
        variant={props.variant}
        accessibility={props.accessibility as ResolvedAccessibility | undefined}
      >
        {childRefs.map((child, index) => {
          const built =
            typeof child === 'string' ? buildChild(child) : buildChild(child.id, child.basePath);
          const key =
            typeof child === 'string'
              ? `${child}-${index}`
              : `${child.id}-${child.basePath ?? index}`;
          const onSelect = () => {
            setSelectedIndex?.(index);
            props.action?.();
          };
          return (
            <SegmentSlotContext.Provider
              key={key}
              value={{selected: index === selectedIndex, onSelect}}
            >
              {built}
            </SegmentSlotContext.Provider>
          );
        })}
      </SegmentedControlView>
    );
  },
);
