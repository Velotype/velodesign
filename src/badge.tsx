import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Various types of `<Badge/>`s
 */
export type BadgeType = "primary" | "secondary" | "warning" | "danger" | "neutral"

/**
 * Attrs type for `<Badge/>` Component
 */
export type BadgeAttrsType = {
    /** What type of badge is this? (sets the color) */
    type?: BadgeType
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areBadgeStylesMounted = false

/**
 * A small inline label, typically used to show a status or count
 */
export const Badge: FunctionComponent<BadgeAttrsType> = function(attrs: BadgeAttrsType, children: RenderableElements[]): HTMLSpanElement {
    if (!areBadgeStylesMounted) {
        areBadgeStylesMounted = true
        setStylesheet(`
.vtd-badge{
display:inline-block;
padding:0.1em 0.6em;
border-radius:999px;
font-size:0.85em;
line-height:1.6;
white-space:nowrap;
vertical-align:middle;
}
.vtd-badge-primary{background-color:var(--primary-3);border:1px solid var(--primary-6);}
.vtd-badge-secondary{background-color:var(--secondary-3);border:1px solid var(--secondary-6);}
.vtd-badge-warning{background-color:var(--warning-3);border:1px solid var(--warning-6);}
.vtd-badge-danger{background-color:var(--accent-3);border:1px solid var(--accent-6);}
.vtd-badge-neutral{background-color:var(--background-2);border:1px solid var(--background-6);}
`, "vtd/Badge")
    }

    return passthroughAttrsToElement<HTMLSpanElement>(<span class={`vtd-badge vtd-badge-${attrs.type||"neutral"}`}>
        {children}
    </span>, attrs)
}
