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

/** The side each placement flips to when its own has no room */
const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = {
    "top": "bottom", "bottom": "top", "left": "right", "right": "left",
    "top-start": "bottom-start", "top-end": "bottom-end", "bottom-start": "top-start", "bottom-end": "top-end"
}

/** How close a bubble may come to the edge of what can be seen, in px */
const EDGE_MARGIN = 8

type Area = {left: number, top: number, right: number, bottom: number}

/**
 * Where a bubble inside `element` can be seen: the viewport, cut down by every ancestor that clips
 * its overflow - a dialog or a scrolling panel hides a bubble past its edge as surely as the window
 * does.
 */
function visibleArea(element: HTMLElement): Area {
    const area: Area = {left: 0, top: 0, right: innerWidth, bottom: innerHeight}
    for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.overflowX === "visible" && style.overflowY === "visible") {continue}
        const rect = parent.getBoundingClientRect()
        area.left = Math.max(area.left, rect.left)
        area.top = Math.max(area.top, rect.top)
        area.right = Math.min(area.right, rect.right)
        area.bottom = Math.min(area.bottom, rect.bottom)
    }
    return area
}

/** Whether a bubble placed `placement` runs past the side it was put on */
function pastItsSide(rect: DOMRect, placement: TooltipPlacement, area: Area): boolean {
    if (placement.startsWith("top")) {return rect.top < area.top + EDGE_MARGIN}
    if (placement.startsWith("bottom")) {return rect.bottom > area.bottom - EDGE_MARGIN}
    if (placement === "left") {return rect.left < area.left + EDGE_MARGIN}
    return rect.right > area.right - EDGE_MARGIN
}

/** How far to slide from `start`-`end` to sit inside `low`-`high` - toward `low` first when it can't fit at all */
function slide(start: number, end: number, low: number, high: number): number {
    if (start < low) {return low - start}
    if (end > high) {return Math.max(high - end, low - start)}
    return 0
}

/**
 * Puts a bubble where it can be seen, each time it shows (decided 2026-11-02): on its own side
 * when there's room, else the opposite one; then slid along that side - right or left for a bubble
 * above or below, up or down for one beside - so it stays inside the visible area. A trigger at
 * the left edge of a page or a dialog had a centred bubble half off it. Measured on show, not kept
 * up to date: a tooltip is open only while pointed at or focused.
 */
function fitBubble(bubble: HTMLElement, placement: TooltipPlacement) {
    bubble.className = `vtd-tooltip vtd-tooltip-${placement}`
    bubble.style.removeProperty("--vtd-tooltip-shift")
    bubble.style.removeProperty("max-width")
    bubble.style.removeProperty("white-space")
    let rect = bubble.getBoundingClientRect()
    // Not shown at all - a whenDisabled bubble around an enabled control
    if (rect.width === 0 && rect.height === 0) {return}
    const area = visibleArea(bubble)
    const across = placement.startsWith("top") || placement.startsWith("bottom")
    // Wider than all there is to see: wrap within it instead
    const room = (across ? area.right - area.left : area.bottom - area.top) - 2 * EDGE_MARGIN
    if (across && rect.width > room) {
        bubble.style.maxWidth = `${Math.max(room, 0)}px`
        bubble.style.whiteSpace = "normal"
        rect = bubble.getBoundingClientRect()
    }
    if (pastItsSide(rect, placement, area)) {
        const flipped = OPPOSITE[placement]
        bubble.className = `vtd-tooltip vtd-tooltip-${flipped}`
        const flippedRect = bubble.getBoundingClientRect()
        if (pastItsSide(flippedRect, flipped, area)) {
            bubble.className = `vtd-tooltip vtd-tooltip-${placement}`
        } else {
            rect = flippedRect
        }
    }
    const shift = across
        ? slide(rect.left, rect.right, area.left + EDGE_MARGIN, area.right - EDGE_MARGIN)
        : slide(rect.top, rect.bottom, area.top + EDGE_MARGIN, area.bottom - EDGE_MARGIN)
    if (shift !== 0) {bubble.style.setProperty("--vtd-tooltip-shift", `${Math.round(shift)}px`)}
}

/**
 * Attrs type for `<Tooltip/>` Component
 */
export type TooltipAttrsType = {
    /** Content to show inside the tooltip bubble */
    content: RenderableElements
    /**
     * Which side of the trigger to show the bubble on (default: `"top"`). Where that side has no
     * room the bubble shows on the opposite one, and it slides along its side to stay in view.
     */
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
.vtd-tooltip-top{bottom:100%;left:50%;transform:translate(calc(-50% + var(--vtd-tooltip-shift,0px)),-0.4em);}
.vtd-tooltip-bottom{top:100%;left:50%;transform:translate(calc(-50% + var(--vtd-tooltip-shift,0px)),0.4em);}
.vtd-tooltip-left{right:100%;top:50%;transform:translate(-0.4em,calc(-50% + var(--vtd-tooltip-shift,0px)));}
.vtd-tooltip-right{left:100%;top:50%;transform:translate(0.4em,calc(-50% + var(--vtd-tooltip-shift,0px)));}
.vtd-tooltip-top-start{bottom:100%;left:0;transform:translate(var(--vtd-tooltip-shift,0px),-0.4em);}
.vtd-tooltip-top-end{bottom:100%;right:0;transform:translate(var(--vtd-tooltip-shift,0px),-0.4em);}
.vtd-tooltip-bottom-start{top:100%;left:0;transform:translate(var(--vtd-tooltip-shift,0px),0.4em);}
.vtd-tooltip-bottom-end{top:100%;right:0;transform:translate(var(--vtd-tooltip-shift,0px),0.4em);}
.vtd-tooltip-when-disabled{outline:none;}
.vtd-tooltip-when-disabled:not(:has(:disabled,[aria-disabled="true"])) .vtd-tooltip{display:none;}
.vtd-tooltip-when-disabled:has(:disabled,[aria-disabled="true"]){cursor:not-allowed;}
.vtd-tooltip-when-disabled :disabled,.vtd-tooltip-when-disabled [aria-disabled="true"]{pointer-events:none;}
.vtd-tooltip-when-disabled .vtd-tooltip{white-space:normal;width:max-content;max-width:16em;}
`, "vtd/Tooltip")
    }

    const placement = attrs.placement || "top"
    const fit = (event: Event) => {
        const bubble = (event.currentTarget as HTMLElement).querySelector<HTMLElement>(":scope > .vtd-tooltip")
        if (bubble) {fitBubble(bubble, placement)}
    }
    if (!attrs.whenDisabled) {
        return passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-tooltip-wrapper" onMouseEnter={fit} onFocusIn={fit}>
            {children}
            <span class={`vtd-tooltip vtd-tooltip-${placement}`} role="tooltip">{attrs.content}</span>
        </span>, attrs)
    }
    // tabindex -1: a tap or click focuses the wrapper (showing the bubble), Tab skips it
    const id = `vtd-tooltip-${++tooltipCount}`
    const wrapper = passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-tooltip-wrapper vtd-tooltip-when-disabled" tabindex={-1} onMouseEnter={fit} onFocusIn={fit} onClick={(event: MouseEvent) => {
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
