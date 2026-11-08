/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import { Component, passthroughAttrsToElement } from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { createElementNSHelper, setAttributeHelper, svgNamespace } from "../core/utilities.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * Various types of `<Progress/>`s
 */
export type ProgressType = "primary" | "secondary" | "warning" | "danger"

/**
 * Attrs type for `<Progress/>` Component
 */
export type ProgressAttrsType = {
    /** Current value */
    value: number
    /** Maximum value (default: `100`) */
    max?: number
    /** What type of progress bar is this? (sets the color) */
    type?: ProgressType
    /** If a `{percent}%` label should be shown next to the bar */
    showLabel?: boolean
    /**
     * The bar is counting work being done - a send, an import - rather than measuring how full
     * something is. While the value is short of `max` it shows that the work is going on (a light
     * passing along the fill; still stripes with the reader's reduce-motion setting on) and the
     * working dots before `status`; when the value reaches `max` it marks the finish once and
     * settles, the dots becoming a tick.
     *
     * Leave it off for a meter (storage used, places taken), which only glides to a new value.
     */
    working?: boolean
    /**
     * Words beside the working dots, saying what's happening ("Sending 124 of 200") - shown only
     * with `working`. No default: the library doesn't assume a language. Change it with `setValue`
     */
    status?: RenderableElements
} & IdAttr & StylePassthroughAttrs

let areProgressStylesMounted = false

/**
 * How long the fill takes to glide to a new value, in ms. The finish waits for the glide, so the
 * tick is drawn once the bar has visibly reached the end.
 */
const GLIDE_MS = 600

/**
 * The working slot: three dots on a line, a pen dot at the tick's first point, and the tick - in
 * the tick's 24-unit box. While working the dots pulse; at the finish they gather at the tick's
 * first point and that point becomes a pen that rides the line as the tick draws.
 */
function workingSlot(): SVGSVGElement {
    const svg = createElementNSHelper("svg") as SVGSVGElement
    setAttributeHelper(svg, "xmlns", svgNamespace)
    setAttributeHelper(svg, "viewBox", "0 0 24 24")
    setAttributeHelper(svg, "class", "vtd-progress-slot")
    setAttributeHelper(svg, "aria-hidden", "true")
    for (const cx of ["6", "12", "18"]) {
        const dot = createElementNSHelper("circle") as SVGCircleElement
        for (const [k, v] of [["class", "vtd-progress-dot"], ["cx", cx], ["cy", "12"], ["r", "2"], ["fill", "currentcolor"]]) {
            setAttributeHelper(dot, k, v)
        }
        svg.appendChild(dot)
    }
    const pen = createElementNSHelper("circle") as SVGCircleElement
    for (const [k, v] of [["class", "vtd-progress-pen"], ["cx", "5"], ["cy", "12.5"], ["r", "1.7"], ["fill", "currentcolor"]]) {
        setAttributeHelper(pen, k, v)
    }
    const tick = createElementNSHelper("path") as SVGPathElement
    for (const [k, v] of [["class", "vtd-progress-tick"], ["d", "M5 12.5l4.5 4.5L19 7.5"], ["fill", "none"], ["stroke", "currentcolor"],
        ["stroke-width", "2.6"], ["stroke-linecap", "round"], ["stroke-linejoin", "round"]]) {
        setAttributeHelper(tick, k, v)
    }
    svg.append(pen, tick)
    return svg
}

/**
 * A determinate progress bar.
 *
 * As a meter it glides to each new value. With `working` it is a task's progress - see
 * {@link ProgressAttrsType.working}. Update it in place with `setValue`, which touches only the
 * fill, the numbers and the status words.
 */
export class Progress extends Component<ProgressAttrsType> {
    #root: HTMLElement
    #track: HTMLElement
    #fill: HTMLElement
    #percent: HTMLElement | undefined
    #status: HTMLElement | undefined
    #max: number
    #finishTimer: number | undefined

    /** Create a new `<Progress/>` Component */
    constructor(attrs: ProgressAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areProgressStylesMounted) {
            areProgressStylesMounted = true
            mountStyles(`
.vtd-progress-wrapper{width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:0.4em;}
.vtd-progress-row{display:flex;align-items:center;gap:0.75em;}
.vtd-progress{flex-grow:1;height:0.6em;border-radius:999px;background-color:var(--background-3);overflow:hidden;}
.vtd-progress-fill{height:100%;width:0;border-radius:999px;position:relative;overflow:hidden;transition:width 0.6s cubic-bezier(0.25,0.8,0.35,1);}
.vtd-progress-primary .vtd-progress-fill{background-color:var(--primary);}
.vtd-progress-secondary .vtd-progress-fill{background-color:var(--secondary);}
.vtd-progress-warning .vtd-progress-fill{background-color:var(--warning);}
.vtd-progress-danger .vtd-progress-fill{background-color:var(--accent);}
.vtd-progress-label{font-size:0.85em;white-space:nowrap;}
` +
/* Working: the status line - the slot holds the place the tick will take, so the words never move */
`
.vtd-progress-status{display:flex;align-items:center;gap:0.45em;}
.vtd-progress-slot{width:1.25em;height:1.25em;flex-shrink:0;overflow:visible;}
.vtd-progress-primary .vtd-progress-slot{color:var(--primary);}
.vtd-progress-secondary .vtd-progress-slot{color:var(--secondary);}
.vtd-progress-warning .vtd-progress-slot{color:var(--warning);}
.vtd-progress-danger .vtd-progress-slot{color:var(--accent);}
.vtd-progress-tick{stroke-dasharray:20;stroke-dashoffset:20;}
.vtd-progress-pen{opacity:0;}
.vtd-progress-dot{transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);}
@keyframes vtd-progress-pulse{0%,80%,100%{opacity:0.3;}40%{opacity:1;}}
@keyframes vtd-progress-sheen{from{transform:translateX(-100%);}to{transform:translateX(250%);}}
.vtd-progress-working:not(.vtd-progress-done) .vtd-progress-dot{animation:vtd-progress-pulse 1s ease-in-out infinite;}
.vtd-progress-working:not(.vtd-progress-done) .vtd-progress-dot:nth-child(2){animation-delay:0.15s;}
.vtd-progress-working:not(.vtd-progress-done) .vtd-progress-dot:nth-child(3){animation-delay:0.3s;}
.vtd-progress-working:not(.vtd-progress-done) .vtd-progress-fill::after{
content:"";position:absolute;inset:0;width:40%;
background:linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
animation:vtd-progress-sheen 1.4s ease-in-out infinite;
}
` +
/*
 * The finish, once: a ring spreads out from the bar and fades; the dots gather at the tick's first
 * point, which becomes a pen riding the line as the tick draws. The dots' fade is an animation, not
 * a transition - the pulse was animating their opacity a moment before, and a browser starts no
 * transition from an animated value.
 */
`
@keyframes vtd-progress-ring{from{box-shadow:0 0 0 0 color-mix(in srgb, currentcolor 50%, transparent);}to{box-shadow:0 0 0 0.55em transparent;}}
@keyframes vtd-progress-melt{from{opacity:1;}to{opacity:0;}}
@keyframes vtd-progress-pen{0%{transform:translate(0,0);opacity:1;}32%{transform:translate(4.5px,4.5px);opacity:1;}85%{opacity:1;}100%{transform:translate(14px,-5px);opacity:0;}}
@keyframes vtd-progress-draw{from{stroke-dashoffset:20;}to{stroke-dashoffset:0;}}
.vtd-progress-done .vtd-progress-dot:nth-child(1){transform:translate(-1px,0.5px);}
.vtd-progress-done .vtd-progress-dot:nth-child(2){transform:translate(-7px,0.5px);}
.vtd-progress-done .vtd-progress-dot:nth-child(3){transform:translate(-13px,0.5px);}
.vtd-progress-done .vtd-progress-dot{animation:vtd-progress-melt 0.05s linear 0.3s both;}
.vtd-progress-done .vtd-progress-pen{animation:vtd-progress-pen 0.6s linear 0.3s forwards;}
.vtd-progress-done .vtd-progress-tick{stroke-dashoffset:0;animation:vtd-progress-draw 0.6s linear 0.3s both;}
.vtd-progress-done .vtd-progress{animation:vtd-progress-ring 0.8s ease-out 1;}
.vtd-progress-primary .vtd-progress{color:var(--primary);}
.vtd-progress-secondary .vtd-progress{color:var(--secondary);}
.vtd-progress-warning .vtd-progress{color:var(--warning);}
.vtd-progress-danger .vtd-progress{color:var(--accent);}
` +
/*
 * Reduce motion: nothing moves. While working the fill shows still stripes instead of the light -
 * a tile laid from the fill's left edge, so as the fill grows it reveals more stripes and the ones
 * already shown stay where they are (an angled repeating gradient is laid out from the box's
 * size, so every stripe would shift as the fill grew). The finish settles at once.
 */
`
@media (prefers-reduced-motion: reduce){
.vtd-progress-fill{transition:none;}
.vtd-progress-wrapper *,.vtd-progress-fill::after{animation:none !important;}
.vtd-progress-dot{transition:none;}
.vtd-progress-working:not(.vtd-progress-done) .vtd-progress-fill::after{content:none;}
.vtd-progress-working:not(.vtd-progress-done) .vtd-progress-fill{
background-image:linear-gradient(135deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent);
background-size:20px 20px;
background-position:0 0;
}
.vtd-progress-done .vtd-progress-dot{opacity:0;}
}
`, "vtd/Progress")
        }

        this.#max = attrs.max || 100
        this.#fill = <span class="vtd-progress-fill"/>
        this.#track = <span class="vtd-progress" role="progressbar" aria-valuemin={0}>{this.#fill}</span>
        this.#percent = attrs.showLabel ? <span class="vtd-progress-label"/> : undefined
        let statusLine: HTMLElement | undefined
        if (attrs.working) {
            const status: HTMLElement = <span class="vtd-progress-status-text">{attrs.status}</span>
            const line: HTMLElement = <span class="vtd-progress-status"/>
            line.append(workingSlot(), status)
            this.#status = status
            statusLine = line
        }
        this.#root = passthroughAttrsToElement<HTMLElement>(<span
            class={`vtd-progress-wrapper vtd-progress-${attrs.type||"primary"}${attrs.working ? " vtd-progress-working" : ""}`}>
            {statusLine ?? null}
            <span class="vtd-progress-row">{this.#track}{this.#percent ?? null}</span>
        </span>, attrs)
        this.#show(attrs.value, false)
    }

    /**
     * Move the bar to a new value, and with `working`, change the words beside it. The fill glides
     * there; with `working`, reaching `max` marks the finish (once), and going back below it
     * resumes working.
     */
    setValue(value: number, status?: RenderableElements) {
        if (status !== undefined && this.#status) {
            if (typeof status === "string") {
                this.#status.textContent = status
            } else {
                this.#status.replaceChildren(...(Array.isArray(status) ? status : [status]) as (Node | string)[])
            }
        }
        this.#show(value, true)
    }

    #show(value: number, glide: boolean) {
        const clamped = Math.min(Math.max(value, 0), this.#max)
        const percent = Math.round(clamped / this.#max * 100)
        this.#fill.style.width = `${clamped / this.#max * 100}%`
        this.#track.setAttribute("aria-valuenow", String(clamped))
        this.#track.setAttribute("aria-valuemax", String(this.#max))
        if (this.#percent) {
            this.#percent.textContent = `${percent}%`
        }
        if (!this.#status) {
            return
        }
        clearTimeout(this.#finishTimer)
        if (clamped < this.#max) {
            this.#root.classList.remove("vtd-progress-done")
            return
        }
        // Finished: once the fill has visibly reached the end, mark the finish and settle. A bar
        // built already finished, or with the reader's reduce-motion setting on, settles at once
        const still = !glide || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        if (still) {
            this.#root.classList.add("vtd-progress-done")
        } else {
            this.#finishTimer = setTimeout(() => { this.#root.classList.add("vtd-progress-done") }, GLIDE_MS)
        }
    }

    /** Render this Component */
    override render(): HTMLElement {
        return this.#root
    }
}
