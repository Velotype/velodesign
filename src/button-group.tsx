import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<ButtonGroup/>` Component
 */
export type ButtonGroupAttrsType = {
    /** Direction to lay out the buttons (default: `"horizontal"`) */
    orientation?: "horizontal" | "vertical"
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areButtonGroupStylesMounted = false

/**
 * Visually joins a row (or column) of `Button`s into a single connected control - adjacent
 * buttons share a border instead of each having their own, and only the outer corners are
 * rounded. Purely a CSS wrapper: it targets its children's own `.vtd-btn` class rather than
 * cloning or otherwise modifying them, so any `Button` (any `type`, disabled or not, with its
 * own `onClick`) works as a child unchanged.
 */
export const ButtonGroup: FunctionComponent<ButtonGroupAttrsType> = function(attrs: ButtonGroupAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areButtonGroupStylesMounted) {
        areButtonGroupStylesMounted = true
        setStylesheet(`
.vtd-button-group{display:inline-flex;}
.vtd-button-group-vertical{flex-direction:column;}
.vtd-button-group .vtd-btn{position:relative;border-radius:0;}
.vtd-button-group .vtd-btn:hover,.vtd-button-group .vtd-btn:focus-visible{z-index:1;}
.vtd-button-group-horizontal .vtd-btn:not(:first-child){margin-inline-start:-1px;}
.vtd-button-group-horizontal .vtd-btn:first-child{border-start-start-radius:0.25rem;border-end-start-radius:0.25rem;}
.vtd-button-group-horizontal .vtd-btn:last-child{border-start-end-radius:0.25rem;border-end-end-radius:0.25rem;}
.vtd-button-group-vertical .vtd-btn:not(:first-child){margin-block-start:-1px;}
.vtd-button-group-vertical .vtd-btn:first-child{border-start-start-radius:0.25rem;border-start-end-radius:0.25rem;}
.vtd-button-group-vertical .vtd-btn:last-child{border-end-start-radius:0.25rem;border-end-end-radius:0.25rem;}
`, "vtd/ButtonGroup")
    }

    const orientation = attrs.orientation || "horizontal"
    return passthroughAttrsToElement<HTMLDivElement>(<div class={`vtd-button-group vtd-button-group-${orientation}`} role="group">
        {children}
    </div>, attrs)
}
