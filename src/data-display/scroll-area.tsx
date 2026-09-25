import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * Attrs type for `<ScrollArea/>` Component
 */
export type ScrollAreaAttrsType = {
    /** CSS max-height of the scrollable region */
    maxHeight?: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areScrollAreaStylesMounted = false

/** Stylesheet for `<ScrollArea/>`, mounted once on first construction */
const scrollAreaCss: string = `
.vtd-scroll-area{
width:100%;
box-sizing:border-box;
overflow:auto;
scrollbar-width:thin;
scrollbar-color:var(--background-6) transparent;
}
.vtd-scroll-area::-webkit-scrollbar{width:0.6em;height:0.6em;}
.vtd-scroll-area::-webkit-scrollbar-track{background:transparent;}
.vtd-scroll-area::-webkit-scrollbar-thumb{background-color:var(--background-6);border-radius:999px;}
`

/**
 * A scrollable container with a themed thin scrollbar, wrapping native overflow scrolling
 * (no virtualization or custom scroll physics - just consistent, theme-aware scrollbar styling)
 */
export const ScrollArea: FunctionComponent<ScrollAreaAttrsType> = function(attrs: ScrollAreaAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areScrollAreaStylesMounted) {
        areScrollAreaStylesMounted = true
        mountStyles(scrollAreaCss, "vtd/ScrollArea")
    }

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-scroll-area" style={{maxHeight: attrs.maxHeight}}>
        {children}
    </div>, attrs)
}
