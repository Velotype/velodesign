import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/** A (possibly incomplete) date-time range, as picked by `<DateTimeRangePicker/>` */
export type DateTimeRangeType = {
    /** Start of the range, as an `YYYY-MM-DDTHH:mm` local date-time string */
    start?: string
    /** End of the range, as an `YYYY-MM-DDTHH:mm` local date-time string */
    end?: string
}

/**
 * Attrs type for `<DateTimeRangePicker/>` Component
 */
export type DateTimeRangePickerAttrsType = {
    /** `name` used as a prefix for the two underlying `<input/>` tags (`${name}-start`/`${name}-end`) */
    name?: string
    /** Currently selected range, if any */
    value?: DateTimeRangeType
    /** Earliest selectable date-time, as an `YYYY-MM-DDTHH:mm` string, for both fields */
    min?: string
    /** Latest selectable date-time, as an `YYYY-MM-DDTHH:mm` string, for both fields */
    max?: string
    /** Granularity of the time picker, in seconds (default: `60`, i.e. no seconds field) */
    step?: number
    /** Is the date-time range picker disabled? */
    disabled?: boolean
    /** Called with the updated range whenever either field changes */
    onChange?: (range: DateTimeRangeType) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areDateTimeRangePickerStylesMounted = false

/**
 * A pair of linked `<input type="datetime-local"/>` fields for picking a *span* of date-times -
 * same native-input-first approach as `DatePicker`/`DateTimePicker` (full keyboard/locale
 * handling for free from the browser), just two of them side by side.
 *
 * Each field constrains the other as far as native `min`/`max` allow: the end field's `min` is
 * pinned to the current start value (can't end before it starts) and the start field's `max` to
 * the current end value, on top of whatever `min`/`max` attrs the consumer passed in for the
 * whole range. This is enforcement *within what the native picker UI allows you to pick* - it
 * doesn't retroactively fix an already-picked pair if the consumer feeds in an inverted `value`
 * directly, which is left as-is (this component doesn't second-guess a controlled value).
 */
export class DateTimeRangePicker extends Component<DateTimeRangePickerAttrsType> {
    #root: HTMLSpanElement
    #startEl: HTMLInputElement
    #endEl: HTMLInputElement
    #attrs: DateTimeRangePickerAttrsType

    /** Create a new `<DateTimeRangePicker/>` Component */
    constructor(attrs: DateTimeRangePickerAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        if (!areDateTimeRangePickerStylesMounted) {
            areDateTimeRangePickerStylesMounted = true
            setStylesheet(`
.vtd-datetimerange{display:inline-flex;align-items:center;gap:0.5em;}
.vtd-datetimerange-input{
padding:0.5ex 1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
color-scheme:inherit;
}
.vtd-datetimerange-input:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-datetimerange-input:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
.vtd-datetimerange-separator{opacity:0.6;}
`, "vtd/DateTimeRangePicker")
        }

        this.#startEl = <input
            type="datetime-local"
            class="vtd-datetimerange-input"
            name={attrs.name ? `${attrs.name}-start` : undefined}
            value={attrs.value?.start}
            min={attrs.min}
            max={attrs.value?.end || attrs.max}
            step={attrs.step}
            disabled={attrs.disabled}
            onChange={() => this.#handleChange()}/>

        this.#endEl = <input
            type="datetime-local"
            class="vtd-datetimerange-input"
            name={attrs.name ? `${attrs.name}-end` : undefined}
            value={attrs.value?.end}
            min={attrs.value?.start || attrs.min}
            max={attrs.max}
            step={attrs.step}
            disabled={attrs.disabled}
            onChange={() => this.#handleChange()}/>

        this.#root = passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-datetimerange">
            {this.#startEl}
            <span class="vtd-datetimerange-separator" aria-hidden="true">–</span>
            {this.#endEl}
        </span>, attrs)
    }

    /** Re-derives each field's live min/max from the other's current value, then reports the new range */
    #handleChange() {
        this.#endEl.min = this.#startEl.value || this.#attrs.min || ""
        this.#startEl.max = this.#endEl.value || this.#attrs.max || ""
        this.#attrs.onChange?.({
            start: this.#startEl.value || undefined,
            end: this.#endEl.value || undefined,
        })
    }

    /** Render this Component */
    override render(): HTMLSpanElement {
        return this.#root
    }
}
