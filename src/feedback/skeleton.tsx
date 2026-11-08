/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { CSSPropertyValue } from "../core/css-value.ts"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * The shape of placeholder a `<Skeleton/>` renders
 */
export type SkeletonVariant = "text" | "circular" | "rectangular"

/**
 * Attrs type for `<Skeleton/>` Component
 */
export type SkeletonAttrsType = {
    /** Shape of the placeholder (default: `"text"`) */
    variant?: SkeletonVariant
    /** CSS width */
    width?: CSSPropertyValue<"width">
    /** CSS height (ignored for `variant: "text"`, which sizes to one line) */
    height?: CSSPropertyValue<"height">
    /** For `variant: "text"`, how many lines to render (default: `1`) */
    lines?: number
} & IdAttr & StylePassthroughAttrs

let areSkeletonStylesMounted = false

/**
 * An animated placeholder shown in place of content that hasn't loaded yet.
 *
 * One band of light sweeps across every block on the page together: the gradient is fixed to the
 * viewport, so each block shows its own slice of the same band, and because the band leans, it
 * reaches each row a moment after the row above - the order the content will arrive in. With the
 * reader's reduce-motion setting on, the blocks are still.
 */
export const Skeleton: FunctionComponent<SkeletonAttrsType> = function(attrs: SkeletonAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areSkeletonStylesMounted) {
        areSkeletonStylesMounted = true
        mountStyles(`
@keyframes vtd-skeleton-sweep{from{background-position:-150vw 0;}to{background-position:50vw 0;}}
.vtd-skeleton{
display:block;
background-color:var(--background-3);
background-image:linear-gradient(100deg, transparent 40%, color-mix(in srgb, var(--background-1) 70%, transparent) 50%, transparent 60%);
background-size:200vw 100%;
background-repeat:no-repeat;
background-attachment:fixed;
animation:vtd-skeleton-sweep 1.6s linear infinite;
}
@media (prefers-reduced-motion: reduce){
.vtd-skeleton{animation:none;background-image:none;}
}
.vtd-skeleton-text{width:100%;box-sizing:border-box;height:1em;border-radius:0.25rem;margin-block-end:0.5em;}
.vtd-skeleton-text:last-child{margin-block-end:0;width:70%;}
.vtd-skeleton-circular{border-radius:50%;}
.vtd-skeleton-rectangular{border-radius:0.25rem;}
`, "vtd/Skeleton")
    }

    const variant = attrs.variant || "text"
    if (variant == "text") {
        const lines = attrs.lines || 1
        return passthroughAttrsToElement<HTMLDivElement>(<div>
            {Array.from({length: lines}).map(() => <span class="vtd-skeleton vtd-skeleton-text" style={{width: attrs.width}}/>)}
        </div>, attrs)
    }
    return passthroughAttrsToElement<HTMLSpanElement>(<span
        class={`vtd-skeleton vtd-skeleton-${variant}`}
        style={{width: attrs.width || (variant=="circular"?"3em":"100%"), height: attrs.height || (variant=="circular"?"3em":"1em")}}/>, attrs)
}
