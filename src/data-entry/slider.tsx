import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"

/**
 * Attrs type for `<Slider/>` Component
 */
export type SliderAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Current value */
    value?: number
    /** Minimum value (default: `0`) */
    min?: number
    /** Maximum value (default: `100`) */
    max?: number
    /** Step size (default: `1`) */
    step?: number
    /** Is the slider disabled? */
    disabled?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areSliderStylesMounted = false

/** Stylesheet for `<Slider/>`, mounted once on first construction */
const sliderCss: string = `
` +
/*
 * The element is 24px tall and transparent; the 0.35em bar a reader sees is drawn by the track
 * pseudo-elements. The bar used to be the input's own background, which made the whole control six
 * pixels tall - the element *is* the hit area for a range input, so a finger had six pixels of
 * vertical room to land in whatever size the thumb was drawn at. See the touch target note in
 * CLAUDE.md for why this one is in px.
 */
`
.vtd-slider{
appearance:none;
-webkit-appearance:none;
width:100%;
height:24px;
background:transparent;
cursor:pointer;
}
.vtd-slider:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-slider::-webkit-slider-runnable-track{
height:0.35em;
border-radius:999px;
background-color:var(--background-3);
}
` +
/*
 * margin-top centres the thumb on the track by hand, which is what -webkit- requires once the track
 * is shorter than the element: half the track's height minus half the thumb's.
 */
`
.vtd-slider::-webkit-slider-thumb{
appearance:none;
-webkit-appearance:none;
width:1.1em;
height:1.1em;
margin-top:calc(0.175em - 0.55em);
border-radius:50%;
background-color:var(--primary);
border:2px solid var(--background);
}
.vtd-slider::-moz-range-thumb{
width:1.1em;
height:1.1em;
border-radius:50%;
background-color:var(--primary);
border:2px solid var(--background);
}
.vtd-slider::-moz-range-track{
height:0.35em;
border-radius:999px;
background-color:var(--background-3);
}
`

/**
 * A themed range input, wrapping a native `<input type="range"/>`
 */
export const Slider: FunctionComponent<SliderAttrsType> = function(attrs: SliderAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areSliderStylesMounted) {
        areSliderStylesMounted = true
        mountStyles(sliderCss, "vtd/Slider")
    }

    return passthroughAttrsToElement<HTMLInputElement>(<input
        type="range"
        class="vtd-slider"
        name={attrs.name}
        value={attrs.value}
        min={attrs.min ?? 0}
        max={attrs.max ?? 100}
        step={attrs.step ?? 1}
        disabled={attrs.disabled}
        onInput={attrs.onInput}
        onChange={attrs.onChange}/>, attrs)
}
