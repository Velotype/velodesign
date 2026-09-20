import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"

/**
 * Attrs type for `<DateTimePicker/>` Component
 */
export type DateTimePickerAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Initial value, as an `YYYY-MM-DDTHH:mm` local date-time string */
    value?: string
    /** Earliest selectable date-time, as an `YYYY-MM-DDTHH:mm` string */
    min?: string
    /** Latest selectable date-time, as an `YYYY-MM-DDTHH:mm` string */
    max?: string
    /** Granularity of the time picker, in seconds (default: `60`, i.e. no seconds field) */
    step?: number
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Is the date-time picker disabled? */
    disabled?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areDateTimePickerStylesMounted = false

/**
 * A themed date-and-time input, wrapping a native `<input type="datetime-local"/>` - like
 * `DatePicker`, the browser supplies the calendar/time picker UI and all keyboard/locale
 * handling for free. For picking a *span* of date-times rather than one, see
 * `DateTimeRangePicker`.
 */
export const DateTimePicker: FunctionComponent<DateTimePickerAttrsType> = function(attrs: DateTimePickerAttrsType, _children: RenderableElements[]): HTMLInputElement {
    if (!areDateTimePickerStylesMounted) {
        areDateTimePickerStylesMounted = true
        mountStyles(`
.vtd-date-time-picker{
padding:0.5ex 1ex;
margin-inline-start:1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
color-scheme:inherit;
}
.vtd-date-time-picker:disabled{cursor:not-allowed;opacity:0.6;}
`, "vtd/DateTimePicker")
    }

    return passthroughAttrsToElement<HTMLInputElement>(<input
        type="datetime-local"
        class="vtd-date-time-picker"
        name={attrs.name}
        value={attrs.value}
        min={attrs.min}
        max={attrs.max}
        step={attrs.step}
        disabled={attrs.disabled}
        required={attrs.required}
        onInput={attrs.onInput}
        onChange={attrs.onChange}/>, attrs)
}
