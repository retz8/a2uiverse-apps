import type {ReactNode} from 'react';
import {PageLayout as PrimerPageLayout, asSlot} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SplitPageLayoutApi} from './split-page-layout.schema';

/**
 * Primer's `SplitPageLayout` is `PageLayout` with these Root presets; its region subcomponents are
 * `PageLayout.*` with split divider/padding defaults (applied by the region leaves). We render the
 * Root as `PageLayout` directly, rather than `SplitPageLayout`, so slot matching can use markers:
 * `SplitPageLayout.Root` overrides the slotsConfig to the `SplitPageLayout.*` subcomponents, which
 * carry NO `__SLOT__` marker (native usage matches them by `child.type ===` reference). The a2ui
 * `DeferredChild` wrapper breaks reference equality, and `isSlot` returns false for a markerless
 * slot — so on `SplitPageLayout` every region flattens into `rest`. `PageLayout`'s default
 * slotsConfig instead keys on the marked `PageLayout.Header`/`.Footer`/`.Sidebar`, so a marker-
 * copying bridge places each region correctly. Same approach as the `PageLayout` catalog component.
 */
const SPLIT_ROOT_PRESETS = {
  containerWidth: 'full',
  padding: 'none',
  columnGap: 'none',
  rowGap: 'none',
} as const;

/**
 * Marker-copying slot bridges for the three identity-slotted regions. Each is a transparent wrapper
 * (`asSlot(wrapper, PrimerPageLayout.<Region>)`) that carries the region's `__SLOT__` marker while
 * rendering the built region node untouched, so `useSlots` places it in the right region. `content`
 * and `pane` are not in the slotsConfig — they fall through to `rest` and render in document order
 * (Pane self-positions start/end), so they need no bridge.
 */
const HeaderSlot = asSlot(function SplitPageLayoutHeaderSlot({children}: {children?: ReactNode}) {
  return <>{children}</>;
}, PrimerPageLayout.Header);
const FooterSlot = asSlot(function SplitPageLayoutFooterSlot({children}: {children?: ReactNode}) {
  return <>{children}</>;
}, PrimerPageLayout.Footer);
const SidebarSlot = asSlot(function SplitPageLayoutSidebarSlot({children}: {children?: ReactNode}) {
  return <>{children}</>;
}, PrimerPageLayout.Sidebar);

/** Resolved props: each region `ComponentId` slot arrives as a built node (or undefined). */
type SplitPageLayoutViewProps = {
  header?: ReactNode;
  content?: ReactNode;
  pane?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
};

export function SplitPageLayoutView({
  header,
  content,
  pane,
  sidebar,
  footer,
}: SplitPageLayoutViewProps) {
  return (
    <PrimerPageLayout {...SPLIT_ROOT_PRESETS}>
      {sidebar ? <SidebarSlot>{sidebar}</SidebarSlot> : null}
      {header ? <HeaderSlot>{header}</HeaderSlot> : null}
      {content}
      {pane}
      {footer ? <FooterSlot>{footer}</FooterSlot> : null}
    </PrimerPageLayout>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders SplitPageLayoutView.
 * - Each region prop is a synthetic `ComponentId` slot built via `buildChild` (the corresponding
 *   region leaf, whose render emits the real Primer subcomponent carrying its slot-marker).
 * - The Root has no resolved scalar props — it is a pure layout container.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const SplitPageLayoutComponent = createComponentImplementation(
  SplitPageLayoutApi,
  ({props, buildChild}) => (
    <SplitPageLayoutView
      header={props.header ? buildChild(props.header) : undefined}
      content={props.content ? buildChild(props.content) : undefined}
      pane={props.pane ? buildChild(props.pane) : undefined}
      sidebar={props.sidebar ? buildChild(props.sidebar) : undefined}
      footer={props.footer ? buildChild(props.footer) : undefined}
    />
  ),
);
