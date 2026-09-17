import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent } from "@velotype/velotype"

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

/**
 * A themed range input, wrapping a native `<input type="range"/>`
 */
export const Slider: FunctionComponent<SliderAttrsType> = function(attrs: SliderAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areSliderStylesMounted) {
        areSliderStylesMounted = true
        setStylesheet(`
.vtd-slider{
appearance:none;
-webkit-appearance:none;
width:100%;
height:0.35em;
border-radius:999px;
background-color:var(--background-3);
cursor:pointer;
}
.vtd-slider:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-slider::-webkit-slider-thumb{
appearance:none;
-webkit-appearance:none;
width:1.1em;
height:1.1em;
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
.vtd-slider:focus-visible{outline:1px solid var(--primary);outline-offset:2px;}
`, "vtd/Slider")
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
