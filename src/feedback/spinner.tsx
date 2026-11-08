/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { createElementNSHelper, setAttributeHelper, svgNamespace } from "../core/utilities.ts"
import type { CSSPropertyValue } from "../core/css-value.ts"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * What a `<Spinner/>` says is happening - two different things, kept visibly apart:
 *
 * - `"ring"` - **waiting**: something is on its way to you (a page, a panel, a search). Shown
 *   where the thing will appear.
 * - `"dots"` - **working**: what you asked for is being done. Shown in the control that started
 *   it, which is why `Button`'s busy state uses it.
 *
 * Content whose layout is known waits better as a `Skeleton` of it than as either.
 */
export type SpinnerVariant = "ring" | "dots"

/**
 * Attrs type for `<Spinner/>` Component
 */
export type SpinnerAttrsType = {
    /** Waiting (`"ring"`, the default) or working (`"dots"`) - see {@link SpinnerVariant} */
    variant?: SpinnerVariant
    /** CSS size of the spinner (default: `"1em"`): the ring's width and height; for the dots, the row's height, and it is twice as wide */
    size?: CSSPropertyValue<"width">
    /** Accessible label announced by screen readers. No default - the library doesn't assume a language; set this (e.g. to "Loading") if the spinner isn't already described by surrounding text */
    label?: string
} & IdAttr & StylePassthroughAttrs

let areSpinnerStylesMounted = false

/** The ring: a quarter arc with round ends going round a faint track, in `currentcolor` */
function ring(): SVGSVGElement {
    const svg = createElementNSHelper("svg") as SVGSVGElement
    setAttributeHelper(svg, "xmlns", svgNamespace)
    setAttributeHelper(svg, "viewBox", "0 0 24 24")
    setAttributeHelper(svg, "class", "vtd-spinner-ring")
    setAttributeHelper(svg, "aria-hidden", "true")
    const track = createElementNSHelper("circle") as SVGCircleElement
    for (const [k, v] of [["cx", "12"], ["cy", "12"], ["r", "9"], ["fill", "none"], ["stroke", "currentcolor"], ["stroke-width", "2.4"], ["stroke-opacity", "0.18"]]) {
        setAttributeHelper(track, k, v)
    }
    const arc = createElementNSHelper("path") as SVGPathElement
    for (const [k, v] of [["d", "M12 3A9 9 0 0 1 21 12"], ["fill", "none"], ["stroke", "currentcolor"], ["stroke-width", "2.4"], ["stroke-linecap", "round"]]) {
        setAttributeHelper(arc, k, v)
    }
    svg.append(track, arc)
    return svg
}

/**
 * A standalone animated loading indicator: a turning ring for waiting, pulsing dots for working.
 * With the reader's reduce-motion setting on, the ring stands still and the dots stay lit in turn
 * as a still row.
 */
export const Spinner: FunctionComponent<SpinnerAttrsType> = function(attrs: SpinnerAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areSpinnerStylesMounted) {
        areSpinnerStylesMounted = true
        mountStyles(`
@keyframes vtd-spinner-rotate{to{transform:rotate(360deg);}}
@keyframes vtd-spinner-pulse{0%,80%,100%{opacity:0.3;}40%{opacity:1;}}
.vtd-spinner{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;}
.vtd-spinner-ring{width:100%;height:100%;animation:vtd-spinner-rotate 0.8s linear infinite;}
.vtd-spinner-dots{gap:12.5%;}
.vtd-spinner-dot{width:25%;aspect-ratio:1;border-radius:50%;background-color:currentcolor;animation:vtd-spinner-pulse 1s ease-in-out infinite;}
.vtd-spinner-dot:nth-child(2){animation-delay:0.15s;}
.vtd-spinner-dot:nth-child(3){animation-delay:0.3s;}
@media (prefers-reduced-motion: reduce){
.vtd-spinner-ring,.vtd-spinner-dot{animation:none;}
}
`, "vtd/Spinner")
    }
    const size = attrs.size || "1em"
    if (attrs.variant == "dots") {
        // Twice as wide as tall: three dots, each a quarter of the width, an eighth of it between
        return passthroughAttrsToElement<HTMLSpanElement>(<span
            class="vtd-spinner vtd-spinner-dots"
            role="status"
            aria-label={attrs.label}
            style={{width: `calc(${size} * 2)`, height: size}}>
            <span class="vtd-spinner-dot"/><span class="vtd-spinner-dot"/><span class="vtd-spinner-dot"/>
        </span>, attrs)
    }
    const spinner: HTMLSpanElement = <span
        class="vtd-spinner"
        role="status"
        aria-label={attrs.label}
        style={{width: size, height: size}}/>
    spinner.appendChild(ring())
    return passthroughAttrsToElement<HTMLSpanElement>(spinner, attrs)
}
