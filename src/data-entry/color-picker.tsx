import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent } from "@velotype/velotype"

/**
 * Attrs type for `<ColorPicker/>` Component
 */
export type ColorPickerAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Current value, as a `#rrggbb` hex color string */
    value?: string
    /** Is the color picker disabled? */
    disabled?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areColorPickerStylesMounted = false

/**
 * A themed color swatch input, wrapping a native `<input type="color"/>` - the browser
 * supplies the actual color-picking UI
 */
export const ColorPicker: FunctionComponent<ColorPickerAttrsType> = function(attrs: ColorPickerAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areColorPickerStylesMounted) {
        areColorPickerStylesMounted = true
        setStylesheet(`
.vtd-color-picker{
appearance:none;
-webkit-appearance:none;
width:2.5em;
height:2.5em;
padding:0.2em;
border-radius:0.4rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
cursor:pointer;
}
.vtd-color-picker::-webkit-color-swatch-wrapper{padding:0;}
.vtd-color-picker::-webkit-color-swatch{border:none;border-radius:0.25rem;}
.vtd-color-picker::-moz-color-swatch{border:none;border-radius:0.25rem;}
.vtd-color-picker:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-color-picker:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
`, "vtd/ColorPicker")
    }

    return passthroughAttrsToElement<HTMLInputElement>(<input
        type="color"
        class="vtd-color-picker"
        name={attrs.name}
        value={attrs.value}
        disabled={attrs.disabled}
        onInput={attrs.onInput}
        onChange={attrs.onChange}/>, attrs)
}
