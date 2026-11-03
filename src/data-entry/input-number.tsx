/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"

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
    /**
     * Keep a typed value within `min`, `max` and a whole-number `step` (default: `true`). A native
     * number input's limits only bound its steppers - typed, any number stands. While typing, a
     * value past `max` becomes `max` and a fraction in a box of whole steps its whole part; when
     * the value is committed (`change`), one under `min` becomes `min` - not while typing, where
     * "2" may be on its way to "20". Each correction is followed by an `input` event, so a value
     * read in `onInput` is always the held one. `false` leaves typed values as typed.
     */
    holdToRange?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areInputNumberStylesMounted = false

/**
 * Hold an `<input type="number"/>`'s value to its own `min`, `max` and `step` - `max` and a
 * whole-number step while typing, `min` too once `committed`. Returns whether it changed the value.
 */
export function holdNumberInputToRange(input: HTMLInputElement, committed: boolean): boolean {
    const typed = input.value
    if (typed === "") {return false}
    let held = Number(typed)
    if (!Number.isFinite(held)) {return false}
    const step = input.step === "" || input.step === "any" ? (input.step === "any" ? undefined : 1) : Number(input.step)
    if (step !== undefined && Number.isInteger(step) && !Number.isInteger(held)) {held = Math.trunc(held)}
    if (input.max !== "" && held > Number(input.max)) {held = Number(input.max)}
    if (committed && input.min !== "" && held < Number(input.min)) {held = Number(input.min)}
    if (held === Number(typed)) {return false}
    input.value = String(held)
    return true
}

/**
 * A themed numeric input, wrapping a native `<input type="number"/>` (including its
 * built-in up/down steppers and keyboard handling)
 */
export const InputNumber: FunctionComponent<InputNumberAttrsType> = function(attrs: InputNumberAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areInputNumberStylesMounted) {
        areInputNumberStylesMounted = true
        mountStyles(`
.vtd-input-number{
padding:0.5ex 1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
width:8em;
}
.vtd-input-number:disabled{cursor:not-allowed;opacity:0.6;}
`, "vtd/InputNumber")
    }

    const hold = attrs.holdToRange !== false
    const onInput = (event: TargetedInputEvent<HTMLInputElement>) => {
        if (hold) {holdNumberInputToRange(event.currentTarget, false)}
        attrs.onInput?.(event)
    }
    const onChange = (event: TargetedEvent<HTMLInputElement, Event>) => {
        // A committed value under `min` is raised to it; `input` tells whoever reads it there
        if (hold && holdNumberInputToRange(event.currentTarget, true)) {
            event.currentTarget.dispatchEvent(new Event("input", {bubbles: true}))
        }
        attrs.onChange?.(event)
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
        onInput={onInput}
        onChange={onChange}/>, attrs)
}
