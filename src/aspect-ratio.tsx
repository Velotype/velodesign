import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<AspectRatio/>` Component
 */
export type AspectRatioAttrsType = {
    /** Width divided by height, e.g. `16/9` (default: `1`) */
    ratio?: number
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areAspectRatioStylesMounted = false

/**
 * Constrains its `children` (typically a single image/video/iframe/map embed) to a fixed
 * width:height ratio, via pure CSS `aspect-ratio` - no JS measurement needed
 */
export const AspectRatio: FunctionComponent<AspectRatioAttrsType> = function(attrs: AspectRatioAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areAspectRatioStylesMounted) {
        areAspectRatioStylesMounted = true
        setStylesheet(`
.vtd-aspect-ratio{position:relative;width:100%;overflow:hidden;}
.vtd-aspect-ratio > *{position:absolute;inset:0;width:100%;height:100%;}
`, "vtd/AspectRatio")
    }

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-aspect-ratio" style={{aspectRatio: `${attrs.ratio || 1}`}}>
        {children}
    </div>, attrs)
}
