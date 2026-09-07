import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Spinner/>` Component
 */
export type SpinnerAttrsType = {
    /** CSS size of the spinner (default: `"1em"`) */
    size?: string
    /** Accessible label announced by screen readers. No default - the library doesn't assume a language; set this (e.g. to "Loading") if the spinner isn't already described by surrounding text */
    label?: string
} & IdAttr & StylePassthroughAttrs

let areSpinnerStylesMounted = false

/**
 * A standalone animated loading indicator
 */
export const Spinner: FunctionComponent<SpinnerAttrsType> = function(attrs: SpinnerAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areSpinnerStylesMounted) {
        areSpinnerStylesMounted = true
        setStylesheet(`
@keyframes vtd-spinner-rotate{to{transform:rotate(360deg);}}
.vtd-spinner{
display:inline-block;
vertical-align:middle;
border-radius:50%;
border:0.15em solid color-mix(in srgb, currentColor 25%, transparent);
border-top-color:currentColor;
animation:vtd-spinner-rotate 0.6s linear infinite;
}
`, "vtd/Spinner")
    }

    const size = attrs.size || "1em"
    return passthroughAttrsToElement<HTMLSpanElement>(<span
        class="vtd-spinner"
        role="status"
        aria-label={attrs.label}
        style={{width: size, height: size}}/>, attrs)
}
