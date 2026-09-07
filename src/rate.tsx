import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, FunctionComponent, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Rate/>` Component
 */
export type RateAttrsType = {
    /** `name` for the radio group backing this Rate (default: an auto-generated unique name) */
    name?: string
    /** Currently selected value */
    value?: number
    /** Number of stars (default: `5`) */
    count?: number
    /** Is the rate control disabled? */
    disabled?: boolean
    /** onChange event handler, fired with the native radio `change` event */
    onChange?: (event: Event) => void
} & IdAttr & StylePassthroughAttrs

let areRateStylesMounted = false
let rateInstanceCounter = 0

/**
 * An interactable star rating, built on a group of visually-hidden native radio inputs -
 * the classic CSS `~` general-sibling-selector star-rating trick, so hover/checked
 * highlighting and keyboard selection all come from the browser for free, same trade-off
 * as `RadioButton`/`Checkbox` wrapping a hidden native input for their visual box.
 */
export const Rate: FunctionComponent<RateAttrsType> = function(attrs: RateAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areRateStylesMounted) {
        areRateStylesMounted = true
        setStylesheet(`
.vtd-rate{
display:inline-flex;
flex-direction:row-reverse;
}
.vtd-rate-input{opacity:0;visibility:hidden;height:0;width:0;position:absolute;}
.vtd-rate-star{
cursor:pointer;
font-size:1.5em;
line-height:1;
padding:0 0.05em;
color:var(--background-5);
transition:color 0.1s ease-in;
}
.vtd-rate-input:checked ~ .vtd-rate-star,
.vtd-rate-star:hover,
.vtd-rate-star:hover ~ .vtd-rate-star{color:var(--warning-8);}
.vtd-rate-disabled .vtd-rate-star{cursor:not-allowed;}
.vtd-rate-input:focus-visible ~ .vtd-rate-star{outline:1px solid var(--primary);outline-offset:2px;}
`, "vtd/Rate")
    }

    const count = attrs.count || 5
    const name = attrs.name || `vtd-rate-${rateInstanceCounter++}`
    // Descending order in the DOM (paired with `flex-direction:row-reverse`) is what lets the
    // `~` general-sibling-selector highlight "this star and every one before it" visually.
    const starValues = Array.from({length: count}, (_, i) => count - i)

    const inputsAndLabels: RenderableElements[] = []
    for (const starValue of starValues) {
        const inputId = `${name}-${starValue}`
        inputsAndLabels.push(<input
            id={inputId}
            type="radio"
            class="vtd-rate-input"
            name={name}
            value={starValue}
            checked={attrs.value == starValue}
            disabled={attrs.disabled}
            onChange={attrs.onChange}/>)
        inputsAndLabels.push(<label class="vtd-rate-star" for={inputId} aria-label={`${starValue} star${starValue==1?"":"s"}`}>★</label>)
    }

    return passthroughAttrsToElement<HTMLSpanElement>(<span class={`vtd-rate${attrs.disabled?" vtd-rate-disabled":""}`} role="radiogroup">
        {inputsAndLabels}
    </span>, attrs)
}
