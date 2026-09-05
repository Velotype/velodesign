import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Placement of a `<Tooltip/>`'s bubble, relative to its trigger content
 */
export type TooltipPlacement = "top" | "bottom" | "left" | "right"

/**
 * Attrs type for `<Tooltip/>` Component
 */
export type TooltipAttrsType = {
    /** Content to show inside the tooltip bubble */
    content: RenderableElements
    /** Which side of the trigger to show the bubble on (default: `"top"`) */
    placement?: TooltipPlacement
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areTooltipStylesMounted = false

/**
 * Wraps `children` (the trigger) with a themed tooltip bubble shown on hover/focus
 *
 * `<Tooltip content="More info">hover me</Tooltip>`
 */
export const Tooltip: FunctionComponent<TooltipAttrsType> = function(attrs: TooltipAttrsType, children: RenderableElements[]): HTMLSpanElement {
    if (!areTooltipStylesMounted) {
        areTooltipStylesMounted = true
        setStylesheet(`
.vtd-tooltip-wrapper{
position:relative;
display:inline-block;
}
.vtd-tooltip{
position:absolute;
z-index:1;
visibility:hidden;
opacity:0;
pointer-events:none;
transition:opacity 0.15s ease-in, visibility 0.15s;
padding:0.4em 0.7em;
border-radius:0.25rem;
background-color:var(--background-9);
color:var(--text-alt);
font-size:0.85em;
white-space:nowrap;
}
.vtd-tooltip-wrapper:hover .vtd-tooltip,
.vtd-tooltip-wrapper:focus-within .vtd-tooltip{
visibility:visible;
opacity:1;
}
.vtd-tooltip-top{bottom:100%;left:50%;transform:translate(-50%,-0.4em);}
.vtd-tooltip-bottom{top:100%;left:50%;transform:translate(-50%,0.4em);}
.vtd-tooltip-left{right:100%;top:50%;transform:translate(-0.4em,-50%);}
.vtd-tooltip-right{left:100%;top:50%;transform:translate(0.4em,-50%);}
`, "vtd/Tooltip")
    }

    const placement = attrs.placement || "top"
    return passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-tooltip-wrapper">
        {children}
        <span class={`vtd-tooltip vtd-tooltip-${placement}`} role="tooltip">{attrs.content}</span>
    </span>, attrs)
}
