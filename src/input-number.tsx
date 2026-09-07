import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent } from "@velotype/velotype"

/**
 * Attrs type for `<InputNumber/>` Component
 */
export type InputNumberAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Current value */
    value?: number
    /** Minimum value */
    min?: number
    /** Maximum value */
    max?: number
    /** Step size (default: `1`) */
    step?: number
    /** Placeholder text */
    placeholder?: string
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Is the input disabled? */
    disabled?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areInputNumberStylesMounted = false

/**
 * A themed numeric input, wrapping a native `<input type="number"/>` (including its
 * built-in up/down steppers and keyboard handling)
 */
export const InputNumber: FunctionComponent<InputNumberAttrsType> = function(attrs: InputNumberAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areInputNumberStylesMounted) {
        areInputNumberStylesMounted = true
        setStylesheet(`
.vtd-input-number{
padding:0.5ex 1ex;
margin-inline-start:1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
width:8em;
}
.vtd-input-number:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-input-number:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
`, "vtd/InputNumber")
    }

    return passthroughAttrsToElement<HTMLInputElement>(<input
        type="number"
        class="vtd-input-number"
        name={attrs.name}
        value={attrs.value}
        min={attrs.min}
        max={attrs.max}
        step={attrs.step}
        placeholder={attrs.placeholder}
        disabled={attrs.disabled}
        required={attrs.required}
        onInput={attrs.onInput}
        onChange={attrs.onChange}/>, attrs)
}
