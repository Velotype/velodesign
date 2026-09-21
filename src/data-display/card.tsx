import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

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
        mountStyles(
/*
 * Three regions, three jobs, and they have to look like it.
 *
 * All three used to carry the card's own background with only a hairline between them, so a card
 * with a header and a footer read as one flat wash and the rule between them did all the work -
 * which it cannot do at 1px against a background a shade away from the page. The body is the card's
 * content and keeps the plain surface; the header and footer are chrome around it and take a step
 * of the background ramp, so the shape of the card is legible before any of its text is read.
 *
 * A step rather than a fill of its own: --background-2 against --background-1 is the same
 * relationship a hover has to a resting row, which is small on purpose. A header that announced
 * itself with a real colour would make every card on a page compete with its own content.
 */
`
.vtd-card{
width:100%;
box-sizing:border-box;
border-radius:0.5rem;
border:1px solid var(--background-4);
background-color:var(--background-1);
overflow:hidden;
}
.vtd-card-header{
padding:0.75em 1em;
background-color:var(--background-2);
border-block-end:1px solid var(--background-4);
font-weight:bold;
}
.vtd-card-body{
padding:1em;
}
` +
/*
 * The footer holds actions, so it is the same chrome as the header and sits flush to the card's
 * bottom edge - a footer with the body's surface under it reads as one more paragraph with some
 * buttons in it rather than as the place the card is acted on.
 */
`
.vtd-card-footer{
display:flex;
align-items:center;
justify-content:flex-end;
gap:0.5em;
padding:0.75em 1em;
background-color:var(--background-2);
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
