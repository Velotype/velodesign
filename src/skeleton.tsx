import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

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
    width?: string
    /** CSS height (ignored for `variant: "text"`, which sizes to one line) */
    height?: string
    /** For `variant: "text"`, how many lines to render (default: `1`) */
    lines?: number
} & IdAttr & StylePassthroughAttrs

let areSkeletonStylesMounted = false

/**
 * An animated placeholder shown in place of content that hasn't loaded yet
 */
export const Skeleton: FunctionComponent<SkeletonAttrsType> = function(attrs: SkeletonAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areSkeletonStylesMounted) {
        areSkeletonStylesMounted = true
        setStylesheet(`
@keyframes vtd-skeleton-pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
.vtd-skeleton{
display:block;
background-color:var(--background-3);
animation:vtd-skeleton-pulse 1.5s ease-in-out infinite;
}
.vtd-skeleton-text{height:1em;border-radius:0.25rem;margin-block-end:0.5em;}
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
