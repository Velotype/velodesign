import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * Attrs type for `<Divider/>` Component
 */
export type DividerAttrsType = {
    /** Direction of the divider line (default: `"horizontal"`) */
    orientation?: "horizontal" | "vertical"
} & IdAttr & StylePassthroughAttrs

let areDividerStylesMounted = false

/**
 * A thin themed line used to visually separate content
 */
export const Divider: FunctionComponent<DividerAttrsType> = function(attrs: DividerAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areDividerStylesMounted) {
        areDividerStylesMounted = true
        mountStyles(`
.vtd-divider-horizontal{
width:100%;
box-sizing:border-box;
border:none;
border-block-start:1px solid var(--background-5);
margin-block:0.5em;
}
.vtd-divider-vertical{
display:inline-block;
align-self:stretch;
border-inline-start:1px solid var(--background-5);
margin-inline:0.5em;
}
`, "vtd/Divider")
    }

    if (attrs.orientation == "vertical") {
        return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-divider-vertical" role="separator" aria-orientation="vertical"/>, attrs)
    }
    return passthroughAttrsToElement<HTMLHRElement>(<hr class="vtd-divider-horizontal" role="separator" aria-orientation="horizontal"/>, attrs)
}
