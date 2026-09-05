import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"

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
} & IdAttr & StylePassthroughAttrs

let arePaginationStylesMounted = false

const ellipsis = "…"

/**
 * Builds the windowed list of page numbers to display: always the first and last page,
 * a window of `siblingCount` pages around the current page, and an `"…"` where there's a gap.
 */
function buildPageWindow(page: number, totalPages: number, siblingCount: number): (number | typeof ellipsis)[] {
    const windowStart = Math.max(2, page - siblingCount)
    const windowEnd = Math.min(totalPages - 1, page + siblingCount)

    const result: (number | typeof ellipsis)[] = [1]
    if (windowStart > 2) {
        result.push(ellipsis)
    } else if (windowStart == 2) {
        result.push(2)
    }
    for (let p = Math.max(windowStart, 3); p <= windowEnd; p++) {
        result.push(p)
    }
    if (windowEnd < totalPages - 2) {
        result.push(ellipsis)
    } else if (windowEnd == totalPages - 2) {
        result.push(totalPages - 1)
    }
    if (totalPages > 1) {
        result.push(totalPages)
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

    return passthroughAttrsToElement<HTMLElement>(<nav aria-label="Pagination" class="vtd-pagination">
        <Button type="secondary" disabled={page <= 1} onClick={() => attrs.onPageChange(page - 1)}>Prev</Button>
        {pageWindow.map(entry => entry == ellipsis
            ? <span class="vtd-pagination-ellipsis" aria-hidden="true">{ellipsis}</span>
            : <Button
                type="text"
                class={entry == page ? "vtd-pagination-current" : ""}
                onClick={() => attrs.onPageChange(entry as number)}>{entry}</Button>)}
        <Button type="secondary" disabled={page >= totalPages} onClick={() => attrs.onPageChange(page + 1)}>Next</Button>
    </nav>, attrs)
}
