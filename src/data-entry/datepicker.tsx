import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent } from "@velotype/velotype"

/**
 * Attrs type for `<DatePicker/>` Component
 */
export type DatePickerAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Initial value, as an `YYYY-MM-DD` date string */
    value?: string
    /** Earliest selectable date, as an `YYYY-MM-DD` date string */
    min?: string
    /** Latest selectable date, as an `YYYY-MM-DD` date string */
    max?: string
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Is the date picker disabled? */
    disabled?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areDatePickerStylesMounted = false

/**
 * A themed date input, wrapping a native `<input type="date"/>` - the browser supplies the
 * calendar picker UI and all keyboard/locale handling for free
 */
export const DatePicker: FunctionComponent<DatePickerAttrsType> = function(attrs: DatePickerAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areDatePickerStylesMounted) {
        areDatePickerStylesMounted = true
        setStylesheet(`
.vtd-datepicker{
padding:0.5ex 1ex;
margin-inline-start:1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
color-scheme:inherit;
}
.vtd-datepicker:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-datepicker:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
`, "vtd/DatePicker")
    }

    return passthroughAttrsToElement<HTMLInputElement>(<input
        type="date"
        class="vtd-datepicker"
        name={attrs.name}
        value={attrs.value}
        min={attrs.min}
        max={attrs.max}
        disabled={attrs.disabled}
        required={attrs.required}
        onInput={attrs.onInput}
        onChange={attrs.onChange}/>, attrs)
}
