import type {ComponentProps, ElementType} from 'react';
import * as octicons from '@primer/octicons-react';
import type {Icon as OcticonComponent} from '@primer/octicons-react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListGroupExpandApi} from './navlist-groupexpand.schema';
import {nameToExport} from '../icon/icon';

/** The octicons namespace as a name-keyed lookup of icon components. */
const OCTICONS = octicons as unknown as Record<string, OcticonComponent | undefined>;

/** Resolve a kebab-case octicon name to its component, or undefined if it is not an octicon name. */
function resolveOcticon(name: string | undefined): OcticonComponent | undefined {
  return name ? OCTICONS[nameToExport(name)] : undefined;
}

/**
 * Resolve a `trailingVisual` string to a component. Primer's default GroupExpand renderItem always
 * renders `trailingVisual` as a component (`jsx(TrailingVisualIcon, {})`), so a literal-text value
 * (e.g. a count like "3") is wrapped in a tiny text component — the faithful reading of Primer's
 * `Icon | string` when the (unrepresentable) custom `renderItem` is dropped.
 */
function resolveTrailingVisual(value: string | undefined): ElementType | undefined {
  if (value === undefined) return undefined;
  const octicon = resolveOcticon(value);
  if (octicon) return octicon as unknown as ElementType;
  const TextVisual = () => <>{value}</>;
  return TextVisual;
}

type AriaCurrent = 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';

/**
 * A resolved GroupExpand item: the binder resolves each nested Dynamic value to a primitive
 * element-wise (icons stay as name strings; the action may resolve to a callable).
 */
type ResolvedGroupItem = {
  text: string;
  href?: string;
  ariaCurrent?: AriaCurrent;
  defaultOpen?: boolean;
  inactiveText?: string;
  leadingVisual?: string;
  trailingVisual?: string;
  trailingAction?: {
    icon: string;
    label: string;
    action?: unknown;
    loading?: boolean;
  };
};

type PrimerGroupExpandProps = ComponentProps<typeof PrimerNavList.GroupExpand>;
type PrimerItems = PrimerGroupExpandProps['items'];

type NavListGroupExpandViewProps = {
  items: ResolvedGroupItem[];
  label: string;
  pages?: number;
};

/**
 * Map a resolved A2UI item to Primer's `GroupItem`: octicon names resolve to components;
 * `trailingVisual` is an octicon component when its string names an octicon, else literal text
 * (Primer's `Icon | string`); the nested trailing action's `onClick` is wired only when the binder
 * resolved its `action` to a callable (the fixtures wire it `functionCall`, render-only).
 */
function toPrimerItem(item: ResolvedGroupItem): PrimerItems[number] {
  const leadingVisual = resolveOcticon(item.leadingVisual);
  const trailingVisual = resolveTrailingVisual(item.trailingVisual);

  const ta = item.trailingAction;
  const trailingAction = ta
    ? {
        icon: resolveOcticon(ta.icon) as unknown as ElementType | undefined,
        label: ta.label,
        loading: ta.loading,
        onClick: typeof ta.action === 'function' ? (ta.action as () => void) : undefined,
      }
    : undefined;

  return {
    text: item.text,
    href: item.href,
    'aria-current': item.ariaCurrent,
    defaultOpen: item.defaultOpen,
    inactiveText: item.inactiveText,
    leadingVisual,
    trailingVisual,
    trailingAction,
  } as PrimerItems[number];
}

export function NavListGroupExpandView({items, label, pages}: NavListGroupExpandViewProps) {
  return <PrimerNavList.GroupExpand label={label} pages={pages} items={items.map(toPrimerItem)} />;
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListGroupExpandView.
 * `props.items` carries resolved (primitive) fields per element at runtime; its inferred type still
 * shows the nested Dynamic values, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const NavListGroupExpandComponent = createComponentImplementation(
  NavListGroupExpandApi,
  ({props}) => (
    <NavListGroupExpandView
      items={props.items as unknown as ResolvedGroupItem[]}
      label={props.label}
      pages={props.pages}
    />
  ),
);
