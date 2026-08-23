import type {ReactNode} from 'react';
import {PageLayout as PrimerPageLayout, asSlot} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PageLayoutApi} from './pagelayout.schema';

type Spacing = 'none' | 'condensed' | 'normal';
type SizeWidth = 'full' | 'medium' | 'large' | 'xlarge';

/**
 * Marker-copying slot bridges for the three identity-slotted regions. Primer's PageLayout auto-slots
 * `header` / `footer` / `sidebar` by scanning its children for a `__SLOT__` marker (`useSlots`); the
 * a2ui `DeferredChild` wrapper around each built region hides that marker, so the scanner cannot see
 * it. Each bridge is a transparent wrapper (`asSlot(wrapper, PageLayout.<Region>)`) that carries the
 * region's marker while rendering the built region node untouched, so the scanner places it in the
 * right region. `content` and `pane` need no bridge — they fall through `useSlots` to `rest` and
 * render in document order (Pane self-positions start/end via CSS + PageLayoutContext).
 */
const HeaderSlot = asSlot(function PageLayoutHeaderSlot({children}: {children?: ReactNode}) {
  return <>{children}</>;
}, PrimerPageLayout.Header);
const FooterSlot = asSlot(function PageLayoutFooterSlot({children}: {children?: ReactNode}) {
  return <>{children}</>;
}, PrimerPageLayout.Footer);
const SidebarSlot = asSlot(function PageLayoutSidebarSlot({children}: {children?: ReactNode}) {
  return <>{children}</>;
}, PrimerPageLayout.Sidebar);

/** Resolved props: each region `ComponentId` arrives as a built node; scale props pass through. */
type PageLayoutViewProps = {
  containerWidth?: SizeWidth;
  padding?: Spacing;
  rowGap?: Spacing;
  columnGap?: Spacing;
  header?: ReactNode;
  content?: ReactNode;
  pane?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
};

export function PageLayoutView({
  containerWidth,
  padding,
  rowGap,
  columnGap,
  header,
  content,
  pane,
  sidebar,
  footer,
}: PageLayoutViewProps) {
  return (
    <PrimerPageLayout
      containerWidth={containerWidth}
      padding={padding}
      rowGap={rowGap}
      columnGap={columnGap}
    >
      {sidebar ? <SidebarSlot>{sidebar}</SidebarSlot> : null}
      {header ? <HeaderSlot>{header}</HeaderSlot> : null}
      {content}
      {pane}
      {footer ? <FooterSlot>{footer}</FooterSlot> : null}
    </PrimerPageLayout>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders PageLayoutView.
 * - Each region (`header`/`content`/`pane`/`sidebar`/`footer`) is an optional `ComponentId`, built
 *   via `buildChild` when present. `header`/`footer`/`sidebar` are wrapped in `asSlot` bridges;
 *   `content`/`pane` pass through as plain `rest` children.
 * - The scale props resolve as static pass-throughs, forwarded to Primer.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PageLayoutComponent = createComponentImplementation(
  PageLayoutApi,
  ({props, buildChild}) => (
    <PageLayoutView
      containerWidth={props.containerWidth}
      padding={props.padding}
      rowGap={props.rowGap}
      columnGap={props.columnGap}
      header={props.header ? buildChild(props.header) : undefined}
      content={props.content ? buildChild(props.content) : undefined}
      pane={props.pane ? buildChild(props.pane) : undefined}
      sidebar={props.sidebar ? buildChild(props.sidebar) : undefined}
      footer={props.footer ? buildChild(props.footer) : undefined}
    />
  ),
);
