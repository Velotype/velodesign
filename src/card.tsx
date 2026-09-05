import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Card/>` Component
 */
export type CardAttrsType = {
    /** Optional content shown in a header region above the body (usually a title) */
    header?: RenderableElements
    /** Optional content shown in a footer region below the body (usually actions) */
    footer?: RenderableElements
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areCardStylesMounted = false

/**
 * A themed container with optional header/footer slots, for grouping related content
 */
export const Card: FunctionComponent<CardAttrsType> = function(attrs: CardAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areCardStylesMounted) {
        areCardStylesMounted = true
        setStylesheet(`
.vtd-card{
border-radius:0.5rem;
border:1px solid var(--background-4);
background-color:var(--background-1);
overflow:hidden;
}
.vtd-card-header{
padding:0.75em 1em;
border-block-end:1px solid var(--background-4);
font-weight:bold;
}
.vtd-card-body{
padding:1em;
}
.vtd-card-footer{
padding:0.75em 1em;
border-block-start:1px solid var(--background-4);
}
`, "vtd/Card")
    }

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-card">
        {attrs.header && <div class="vtd-card-header">{attrs.header}</div>}
        <div class="vtd-card-body">{children}</div>
        {attrs.footer && <div class="vtd-card-footer">{attrs.footer}</div>}
    </div>, attrs)
}
