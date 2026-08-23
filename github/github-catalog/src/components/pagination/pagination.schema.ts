import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Pagination, props-only.
 *
 * Pagination generates its own numbered page links from `pageCount`; it takes no children. Each
 * page link carries both an `href` (from `hrefBuilder`) and an `onClick`, and Primer never
 * preventDefaults — the consumer chooses which channel wins. A2UI carries both and lets the mode
 * fall out of whether `currentPage` is bound (the Checkbox `checked`/`onChange` precedent):
 * - Controlled — `currentPage` bound to a path. The generic binder auto-generates a
 *   `setCurrentPage(value: number)` setter from the `DynamicNumber` prop; the render's
 *   `onPageChange` preventDefaults and writes the new page back to that path. No on-surface
 *   navigation, no `Action`.
 * - Uncontrolled — `currentPage` a literal plus a real `hrefBuilder` template. The render detects
 *   the literal (no `{path}` binding) and wires no `onPageChange`, so the browser follows the
 *   templated `href`.
 *
 * Faithful 1:1 translation of Primer Pagination's real prop surface:
 * - `pageCount` / `currentPage` are the required runtime state -> DynamicNumber.
 * - `marginPageCount` / `surroundingPageCount` are fixed configuration -> plain number.
 * - `showPages` is fixed configuration -> plain boolean (the `ResponsiveValue<boolean>` arm has no
 *   authoring-time signal in A2UI and is not carried).
 * - `hrefBuilder` is carried as a plain string URL template; the token `{page}` is replaced with
 *   the page number at render time.
 * - `accessibility` labels the pagination navigation landmark -> CommonSchemas.AccessibilityAttributes.
 *
 * Dropped/deferred: `onPageChange` (represented by the two-way binding on `currentPage`),
 * `renderPage` (a per-page render-prop, not data), `className` (styling passthrough), and the
 * non-aria `...rest` spread onto the `<nav>`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const PaginationApi = {
  name: 'Pagination',
  schema: z
    .object({
      pageCount: CommonSchemas.DynamicNumber,
      currentPage: CommonSchemas.DynamicNumber,
      marginPageCount: z.number().optional(),
      showPages: z.boolean().optional(),
      surroundingPageCount: z.number().optional(),
      hrefBuilder: z.string().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type PaginationProps = z.infer<typeof PaginationApi.schema>;
