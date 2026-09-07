import { type EmptyAttrs, type FunctionComponent, passthroughAttrsToElement, type RenderableElements, setStylesheet } from "@velotype/velotype"
import { Button } from "./button.tsx"
import type { IdAttr, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Options to customize `<Pagination/>` Component Theme
 */
export const PaginationThemeOptions: {
    prevSymbol: FunctionComponent<EmptyAttrs>
    nextSymbol: FunctionComponent<EmptyAttrs>
} = {
    prevSymbol: function(){return "‹"},
    nextSymbol: function(){return "›"}
}

/**
 * Attrs type for `<Pagination/>` Component
 */
export type PaginationAttrsType = {
    /** Currently selected page (1-indexed) */
    page: number
    /** Total number of pages */
    totalPages: number
    /** Called with the newly selected page number when the user picks a different page */
    onPageChange: (page: number) => void
    /** How many page numbers to show on each side of the current page (default: `2`) */
    siblingCount?: number
    /** Previous-page button content (default: `PaginationThemeOptions.prevSymbol` - a plain "‹", not English text, so the library doesn't assume a language) */
    prevButtonChildren?: RenderableElements
    /** Next-page button content (default: `PaginationThemeOptions.nextSymbol` - a plain "›", not English text, so the library doesn't assume a language) */
    nextButtonChildren?: RenderableElements
    /** Accessible label for the navigation landmark. No default - the library doesn't assume a language; set this (e.g. to "Pagination") to give screen reader users a description */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs

let arePaginationStylesMounted = false

const ellipsis = "…"

/**
 * Builds the windowed list of page numbers to display: always the first and last page, a
 * window of `siblingCount` pages around the current page, and an `"…"` wherever a gap remains.
 *
 * Built from a `Set` (deduping page 1/`totalPages`/the sibling window by construction) rather
 * than tracking window boundaries by hand - a previous arithmetic version double-counted page 2
 * as both "start of the sibling window" and "the last page" whenever `totalPages` was 2 (and,
 * worse, could show a nonexistent page 2 when `totalPages` was 1).
 */
function buildPageWindow(page: number, totalPages: number, siblingCount: number): (number | typeof ellipsis)[] {
    const pagesToShow = new Set<number>([1, totalPages])
    for (let p = page - siblingCount; p <= page + siblingCount; p++) {
        if (p >= 1 && p <= totalPages) {
            pagesToShow.add(p)
        }
    }

    const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b)
    const result: (number | typeof ellipsis)[] = []
    let previousPage: number | undefined
    for (const p of sortedPages) {
        if (previousPage !== undefined && p - previousPage > 1) {
            result.push(ellipsis)
        }
        result.push(p)
        previousPage = p
    }
    return result
}

/**
 * A control for navigating between pages of results
 */
export const Pagination: FunctionComponent<PaginationAttrsType> = function(attrs: PaginationAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!arePaginationStylesMounted) {
        arePaginationStylesMounted = true
        setStylesheet(`
.vtd-pagination{
display:flex;
align-items:center;
gap:0.25em;
}
.vtd-pagination-current{
background-color:var(--primary-3);
font-weight:bold;
}
.vtd-pagination-ellipsis{
padding:0.25rem 0.5rem;
}
`, "vtd/Pagination")
    }

    const totalPages = Math.max(1, attrs.totalPages)
    const page = Math.min(Math.max(1, attrs.page), totalPages)
    const siblingCount = attrs.siblingCount === undefined ? 2 : attrs.siblingCount
    const pageWindow = buildPageWindow(page, totalPages, siblingCount)

    return passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-pagination">
        <Button type="secondary" disabled={page <= 1} onClick={() => attrs.onPageChange(page - 1)}>{attrs.prevButtonChildren || <PaginationThemeOptions.prevSymbol/>}</Button>
        {pageWindow.map(entry => entry == ellipsis
            ? <span class="vtd-pagination-ellipsis" aria-hidden="true">{ellipsis}</span>
            : <Button
                type="text"
                class={entry == page ? "vtd-pagination-current" : ""}
                onClick={() => attrs.onPageChange(entry as number)}>{entry}</Button>)}
        <Button type="secondary" disabled={page >= totalPages} onClick={() => attrs.onPageChange(page + 1)}>{attrs.nextButtonChildren || <PaginationThemeOptions.nextSymbol/>}</Button>
    </nav>, attrs)
}
