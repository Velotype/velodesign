/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * Placement of a `<Tooltip/>`'s bubble, relative to its trigger content
 */
export type TooltipPlacement = "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end"

/**
 * Attrs type for `<Tooltip/>` Component
 */
export type TooltipAttrsType = {
    /** Content to show inside the tooltip bubble */
    content: RenderableElements
    /** Which side of the trigger to show the bubble on (default: `"top"`) */
    placement?: TooltipPlacement
    /**
     * Explain why a control is disabled: the bubble shows only while a control inside is disabled
     * (`disabled` or `aria-disabled="true"`), so it can wrap a control whose state changes. A
     * disabled control takes no pointer events or focus, so the wrapper takes them instead - and
     * a tap focuses it, which is how a touch screen, with no hover, shows the reason. The wrapper
     * keeps that tap to itself, as the disabled control would have: place it directly around the
     * control, inside anything that listens for the control's clicks (a `Popconfirm` trigger).
     */
    whenDisabled?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areTooltipStylesMounted = false
let tooltipCount = 0

/**
 * Wraps `children` (the trigger) with a themed tooltip bubble shown on hover/focus
 *
 * `<Tooltip content="More info">hover me</Tooltip>`
 */
export const Tooltip: FunctionComponent<TooltipAttrsType> = function(attrs: TooltipAttrsType, children: RenderableElements[]): HTMLSpanElement {
    if (!areTooltipStylesMounted) {
        areTooltipStylesMounted = true
        mountStyles(`
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
.vtd-tooltip-top-start{bottom:100%;left:0;transform:translateY(-0.4em);}
.vtd-tooltip-top-end{bottom:100%;right:0;transform:translateY(-0.4em);}
.vtd-tooltip-bottom-start{top:100%;left:0;transform:translateY(0.4em);}
.vtd-tooltip-bottom-end{top:100%;right:0;transform:translateY(0.4em);}
.vtd-tooltip-when-disabled{outline:none;}
.vtd-tooltip-when-disabled:not(:has(:disabled,[aria-disabled="true"])) .vtd-tooltip{display:none;}
.vtd-tooltip-when-disabled:has(:disabled,[aria-disabled="true"]){cursor:not-allowed;}
.vtd-tooltip-when-disabled :disabled,.vtd-tooltip-when-disabled [aria-disabled="true"]{pointer-events:none;}
.vtd-tooltip-when-disabled .vtd-tooltip{white-space:normal;width:max-content;max-width:16em;}
`, "vtd/Tooltip")
    }

    const placement = attrs.placement || "top"
    if (!attrs.whenDisabled) {
        return passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-tooltip-wrapper">
            {children}
            <span class={`vtd-tooltip vtd-tooltip-${placement}`} role="tooltip">{attrs.content}</span>
        </span>, attrs)
    }
    // tabindex -1: a tap or click focuses the wrapper (showing the bubble), Tab skips it
    const id = `vtd-tooltip-${++tooltipCount}`
    const wrapper = passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-tooltip-wrapper vtd-tooltip-when-disabled" tabindex={-1} onClick={(event: MouseEvent) => {
        // A disabled control's click never reaches anything around it; the tap that shows the reason mustn't either
        if (wrapper.querySelector(':disabled, [aria-disabled="true"]')) {event.stopPropagation()}
    }}>
        {children}
        <span id={id} class={`vtd-tooltip vtd-tooltip-${placement}`} role="tooltip">{attrs.content}</span>
    </span>, attrs)
    for (const control of wrapper.querySelectorAll("button, input, select, textarea, [aria-disabled]")) {
        control.setAttribute("aria-describedby", id)
    }
    return wrapper
}
