import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { cssAlign, resolveGap } from "./spacing.ts"
import type { AlignItems, GapSize } from "./spacing.ts"

/**
 * Attrs type for `<Grid/>` Component
 */
export type GridAttrsType = {
    /**
     * A fixed number of equal columns.
     *
     * Prefer `minColumnWidth` unless the count itself is meaningful: a fixed count has to be
     * re-chosen at every breakpoint, and getting that wrong is how a three-column grid ends up
     * three columns wide on a phone.
     */
    columns?: number
    /**
     * Fit as many columns as will hold this width, then share the remainder (default: `"16em"`).
     *
     * This is the responsive default - `repeat(auto-fill, minmax(<this>, 1fr))` - so a grid reflows
     * on its own without a media query, and without the consumer picking breakpoints.
     */
    minColumnWidth?: string
    /** Space between cells - a scale step, or any CSS length (default: `"md"`) */
    gap?: GapSize | string
    /** How cells line up within their row */
    align?: AlignItems
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areGridStylesMounted = false

/**
 * Two-dimensional layout: cells that reflow to fill the width they are given.
 *
 * Replaces the hand-written `repeat(auto-fill, minmax(220px, 1fr))` that every product grows for
 * its form fields, card lists and stat rows - each with a slightly different minimum, so none of
 * them line up with each other.
 */
export const Grid: FunctionComponent<GridAttrsType> = function(attrs: GridAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areGridStylesMounted) {
        areGridStylesMounted = true
        setStylesheet(`
.vtd-grid{display:grid;width:100%;box-sizing:border-box;}
`, "vtd/Grid")
    }

    // A fixed count wins when given, since asking for both is a contradiction rather than a blend
    const template = attrs.columns !== undefined
        ? `repeat(${Math.max(1, Math.floor(attrs.columns))}, minmax(0, 1fr))`
        : `repeat(auto-fill, minmax(${attrs.minColumnWidth ?? "16em"}, 1fr))`

    return passthroughAttrsToElement<HTMLDivElement>(<div
        class="vtd-grid"
        style={{
            gridTemplateColumns: template,
            gap: resolveGap(attrs.gap),
            alignItems: cssAlign(attrs.align)
        }}>{children}</div>, attrs)
}
