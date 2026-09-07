import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"

/**
 * Attrs type for `<Calendar/>` Component
 */
export type CalendarAttrsType = {
    /** Currently selected date, if any */
    value?: Date
    /** Called when the user clicks a day cell */
    onSelectDate?: (date: Date) => void
} & IdAttr & StylePassthroughAttrs

let areCalendarStylesMounted = false

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

/** Does `a` fall on the same calendar day as `b`? */
function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() == b.getDate()
}

/**
 * A month-grid date picker with prev/next month navigation and a selectable day
 */
export class Calendar extends Component<CalendarAttrsType> {
    /** First day of the month currently displayed */
    #viewDate: Date

    /** Create a new `<Calendar/>` Component */
    constructor(attrs: CalendarAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        const today = new Date()
        this.#viewDate = attrs.value ? new Date(attrs.value.getFullYear(), attrs.value.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
        if (!areCalendarStylesMounted) {
            areCalendarStylesMounted = true
            setStylesheet(`
.vtd-calendar{width:20em;max-width:100%;}
.vtd-calendar-header{display:flex;align-items:center;justify-content:space-between;margin-block-end:0.5em;}
.vtd-calendar-title{font-weight:bold;}
.vtd-calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:0.15em;text-align:center;}
.vtd-calendar-weekday{font-size:0.8em;opacity:0.6;padding-block:0.3em;}
.vtd-calendar-day{
padding:0.4em 0;
border-radius:0.25rem;
border:none;
background:transparent;
color:inherit;
font:inherit;
cursor:pointer;
}
.vtd-calendar-day:hover{background-color:var(--background-1);}
.vtd-calendar-day-outside{opacity:0.35;}
.vtd-calendar-day-selected{background-color:var(--primary);color:var(--text-alt);}
.vtd-calendar-day-today{font-weight:bold;box-shadow:inset 0 0 0 1px var(--primary-6);}
`, "vtd/Calendar")
        }
    }

    /** Move the displayed month by `delta` months and re-render */
    #changeMonth(delta: number) {
        this.#viewDate = new Date(this.#viewDate.getFullYear(), this.#viewDate.getMonth() + delta, 1)
        this.refresh()
    }

    /** Render this Component */
    override render(attrs: CalendarAttrsType): RenderableElements {
        const year = this.#viewDate.getFullYear()
        const month = this.#viewDate.getMonth()
        const firstOfMonth = new Date(year, month, 1)
        const startOffset = firstOfMonth.getDay()
        const gridStart = new Date(year, month, 1 - startOffset)
        const today = new Date()

        const days = Array.from({length: 42}, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))

        return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-calendar">
            <div class="vtd-calendar-header">
                <Button type="text" onClick={() => this.#changeMonth(-1)}>‹</Button>
                <span class="vtd-calendar-title">{this.#viewDate.toLocaleDateString(undefined, {month: "long", year: "numeric"})}</span>
                <Button type="text" onClick={() => this.#changeMonth(1)}>›</Button>
            </div>
            <div class="vtd-calendar-grid" role="grid">
                {weekdayLabels.map(label => <span class="vtd-calendar-weekday">{label}</span>)}
                {days.map(day => {
                    const outside = day.getMonth() != month
                    const selected = attrs.value ? isSameDay(day, attrs.value) : false
                    const isToday = isSameDay(day, today)
                    return <button
                        type="button"
                        class={`vtd-calendar-day${outside ? " vtd-calendar-day-outside" : ""}${selected ? " vtd-calendar-day-selected" : ""}${isToday ? " vtd-calendar-day-today" : ""}`}
                        onClick={() => attrs.onSelectDate?.(day)}>{day.getDate()}</button>
                })}
            </div>
        </div>, attrs)
    }
}
