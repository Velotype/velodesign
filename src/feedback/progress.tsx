import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

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
} & IdAttr & StylePassthroughAttrs

let areProgressStylesMounted = false

/**
 * A determinate progress bar, wrapping a native `<progress/>`
 */
export const Progress: FunctionComponent<ProgressAttrsType> = function(attrs: ProgressAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areProgressStylesMounted) {
        areProgressStylesMounted = true
        setStylesheet(`
.vtd-progress-wrapper{width:100%;box-sizing:border-box;display:flex;align-items:center;gap:0.75em;}
.vtd-progress{
appearance:none;
-webkit-appearance:none;
flex-grow:1;
height:0.6em;
border-radius:999px;
border:none;
overflow:hidden;
}
.vtd-progress::-webkit-progress-bar{background-color:var(--background-3);border-radius:999px;}
.vtd-progress::-moz-progress-bar{border-radius:999px;background-color:var(--primary);}
.vtd-progress::-webkit-progress-value{border-radius:999px;background-color:var(--primary);transition:width 0.2s ease-in-out;}
.vtd-progress-primary::-moz-progress-bar{background-color:var(--primary);}
.vtd-progress-primary::-webkit-progress-value{background-color:var(--primary);}
.vtd-progress-secondary::-moz-progress-bar{background-color:var(--secondary);}
.vtd-progress-secondary::-webkit-progress-value{background-color:var(--secondary);}
.vtd-progress-warning::-moz-progress-bar{background-color:var(--warning);}
.vtd-progress-warning::-webkit-progress-value{background-color:var(--warning);}
.vtd-progress-danger::-moz-progress-bar{background-color:var(--accent);}
.vtd-progress-danger::-webkit-progress-value{background-color:var(--accent);}
.vtd-progress-label{font-size:0.85em;white-space:nowrap;}
`, "vtd/Progress")
    }

    const max = attrs.max || 100
    const percent = Math.round((Math.min(Math.max(attrs.value, 0), max) / max) * 100)

    return passthroughAttrsToElement<HTMLElement>(<span class="vtd-progress-wrapper">
        <progress class={`vtd-progress vtd-progress-${attrs.type||"primary"}`} value={attrs.value} max={max}/>
        {attrs.showLabel ? <span class="vtd-progress-label">{percent}%</span> : null}
    </span>, attrs)
}
