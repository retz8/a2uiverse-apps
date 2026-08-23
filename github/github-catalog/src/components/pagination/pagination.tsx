import type {MouseEvent} from 'react';
import {Pagination as PrimerPagination} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PaginationApi} from './pagination.schema';

/** Resolved accessibility: nested DynamicStrings are plain strings after the binder resolves them. */
type ResolvedAccessibility = {label?: string; description?: string};

/** The default on-surface anchor template when no `hrefBuilder` is authored. */
const DEFAULT_HREF_TEMPLATE = '#{page}';

/** Resolved props: Dynamic* are resolved to primitives; the two-way write-back is onPageChange. */
type PaginationViewProps = {
  pageCount: number;
  currentPage: number;
  marginPageCount?: number;
  showPages?: boolean;
  surroundingPageCount?: number;
  hrefBuilder?: string;
  accessibility?: ResolvedAccessibility;
  /** The two-way write-back: the binder's auto-generated setCurrentPage, called with the new page. */
  onPageChange?: (page: number) => void;
};

export function PaginationView({
  pageCount,
  currentPage,
  marginPageCount,
  showPages,
  surroundingPageCount,
  hrefBuilder,
  accessibility,
  onPageChange,
}: PaginationViewProps) {
  return (
    <PrimerPagination
      pageCount={pageCount}
      currentPage={currentPage}
      marginPageCount={marginPageCount}
      showPages={showPages}
      surroundingPageCount={surroundingPageCount}
      hrefBuilder={n => (hrefBuilder ?? DEFAULT_HREF_TEMPLATE).replaceAll('{page}', String(n))}
      aria-label={accessibility?.label}
      onPageChange={(e: MouseEvent, n: number) => {
        if (onPageChange) {
          // Controlled: currentPage is bound -> intercept, write the new page on-surface.
          e.preventDefault();
          onPageChange(n);
        }
        // Uncontrolled: literal currentPage -> no setter -> let the templated href navigate.
      }}
    />
  );
}

/** True when the raw `currentPage` prop is a `{path}` data binding (controlled mode). */
function isBinding(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'path' in value;
}

/**
 * Catalog entry: the generic binder resolves props, then renders PaginationView.
 * - `props.currentPage` is the resolved page number; `props.setCurrentPage` is the binder's
 *   auto-generated two-way setter. The binder always materializes that setter for a `DynamicNumber`
 *   prop — for a literal value it exists but no-ops (see GenerateSetters in @a2ui/web_core
 *   generic-binder), so its mere presence can NOT distinguish the modes. Instead we read the raw
 *   `currentPage` from the component model: a `{path}` binding means controlled. Controlled →
 *   `onPageChange` intercepts the click (preventDefault) and writes the new page on-surface;
 *   uncontrolled (literal `currentPage`) → no `onPageChange`, so the templated `href` navigates and
 *   pages stay real, shareable links.
 * - `props.accessibility` carries resolved (plain-string) label at runtime; its inferred type
 *   still shows the nested DynamicString, so it is cast to the resolved shape.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const PaginationComponent = createComponentImplementation(
  PaginationApi,
  ({props, context}) => {
    const controlled = isBinding(context.componentModel.properties.currentPage);
    return (
      <PaginationView
        pageCount={props.pageCount}
        currentPage={props.currentPage}
        marginPageCount={props.marginPageCount}
        showPages={props.showPages}
        surroundingPageCount={props.surroundingPageCount}
        hrefBuilder={props.hrefBuilder}
        accessibility={props.accessibility as ResolvedAccessibility | undefined}
        onPageChange={controlled ? props.setCurrentPage : undefined}
      />
    );
  },
);
