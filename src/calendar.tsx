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
 *
 * Implements the ARIA APG "Date Picker Dialog" grid keyboard model: one day cell at a time is
 * a Tab stop (a roving `tabindex`, tracked as `#focusedDate` - `value`/today, in that preference
 * order, until an arrow key moves it), Left/Right/Up/Down move a day/week at a time, Home/End
 * jump to the start/end of the current week, and PageUp/PageDown step a month (Shift+PageUp/Down
 * a year) - crossing a month boundary rebuilds the grid and then refocuses the same date's new
 * cell, since the old one no longer exists once that happens.
 *
 * Unlike almost every other stateful `Component` in this package (see the "Avoid refresh()"
 * section of CLAUDE.md), `#header`/`#gridEl` are built once and updated via `#renderGrid()`
 * rather than `this.refresh()`-ing the whole component on every navigation - not for the usual
 * "don't tear down consumer content" reason (a Calendar has none), but because refocusing a day
 * cell after a month change needs a stable element to query the freshly-built grid through, and
 * `refresh()` replaces the component's entire rendered tree out from under any reference to it.
 */
export class Calendar extends Component<CalendarAttrsType> {
    /** First day of the month currently displayed */
    #viewDate: Date
    /** The date that currently holds the grid's roving tabindex/focus */
    #focusedDate: Date
    #attrs: CalendarAttrsType

    #root: HTMLDivElement
    #titleEl: HTMLSpanElement = <span class="vtd-calendar-title"/>
    #gridEl: HTMLDivElement = <div class="vtd-calendar-grid" role="grid"/>

    /** Create a new `<Calendar/>` Component */
    constructor(attrs: CalendarAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        const today = new Date()
        this.#viewDate = attrs.value ? new Date(attrs.value.getFullYear(), attrs.value.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
        this.#focusedDate = attrs.value ?? today
        if (!areCalendarStylesMounted) {
            areCalendarStylesMounted = true
            setStylesheet(`
.vtd-calendar{width:20em;max-width:100%;}
.vtd-calendar-header{display:flex;align-items:center;justify-content:space-between;margin-block-end:0.5em;}
.vtd-calendar-title{font-weight:bold;}
.vtd-calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:0.15em;text-align:center;}
.vtd-calendar-weekdays{display:contents;}
.vtd-calendar-weekday{font-size:0.8em;opacity:0.6;padding-block:0.3em;}
.vtd-calendar-week{display:contents;}
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
.vtd-calendar-day:focus-visible{outline:1px solid var(--primary);outline-offset:1px;}
.vtd-calendar-day-outside{opacity:0.35;}
.vtd-calendar-day-selected{background-color:var(--primary);color:var(--text-alt);}
.vtd-calendar-day-today{font-weight:bold;box-shadow:inset 0 0 0 1px var(--primary-6);}
`, "vtd/Calendar")
        }

        this.#gridEl.addEventListener("keydown", this.#handleGridKeyDown)

        this.#root = passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-calendar">
            <div class="vtd-calendar-header">
                <Button type="text" onClick={() => this.#changeMonth(-1)}>‹</Button>
                {this.#titleEl}
                <Button type="text" onClick={() => this.#changeMonth(1)}>›</Button>
            </div>
            {this.#gridEl}
        </div>, attrs)

        this.#renderGrid()
    }

    /** Move the displayed month by `delta` months and re-render, keeping the currently-focused
     * day-of-month (clamped to the new month's length) so repeated clicks step predictably */
    #changeMonth(delta: number) {
        const day = this.#focusedDate.getDate()
        this.#viewDate = new Date(this.#viewDate.getFullYear(), this.#viewDate.getMonth() + delta, 1)
        const daysInNewMonth = new Date(this.#viewDate.getFullYear(), this.#viewDate.getMonth() + 1, 0).getDate()
        this.#focusedDate = new Date(this.#viewDate.getFullYear(), this.#viewDate.getMonth(), Math.min(day, daysInNewMonth))
        this.#renderGrid()
    }

    /** Moves the roving tabindex/focus to `date`, changing the displayed month first (and
     * rebuilding the grid) if `date` falls outside it - the currently-focused button is always
     * about to be replaced in that case, so focus must be re-applied to its replacement after */
    #moveFocusTo(date: Date) {
        this.#focusedDate = date
        const monthChanged = date.getFullYear() != this.#viewDate.getFullYear() || date.getMonth() != this.#viewDate.getMonth()
        if (monthChanged) {
            this.#viewDate = new Date(date.getFullYear(), date.getMonth(), 1)
        }
        this.#renderGrid()
        this.#gridEl.querySelector<HTMLButtonElement>(".vtd-calendar-day[tabindex=\"0\"]")?.focus()
    }

    #handleGridKeyDown = (event: KeyboardEvent) => {
        const deltas: Record<string, number> = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7}
        if (event.key in deltas) {
            event.preventDefault()
            const next = new Date(this.#focusedDate)
            next.setDate(next.getDate() + deltas[event.key])
            this.#moveFocusTo(next)
        } else if (event.key == "Home") {
            event.preventDefault()
            const next = new Date(this.#focusedDate)
            next.setDate(next.getDate() - next.getDay())
            this.#moveFocusTo(next)
        } else if (event.key == "End") {
            event.preventDefault()
            const next = new Date(this.#focusedDate)
            next.setDate(next.getDate() + (6 - next.getDay()))
            this.#moveFocusTo(next)
        } else if (event.key == "PageUp") {
            event.preventDefault()
            const next = new Date(this.#focusedDate)
            next.setMonth(next.getMonth() + (event.shiftKey ? -12 : -1))
            this.#moveFocusTo(next)
        } else if (event.key == "PageDown") {
            event.preventDefault()
            const next = new Date(this.#focusedDate)
            next.setMonth(next.getMonth() + (event.shiftKey ? 12 : 1))
            this.#moveFocusTo(next)
        }
    }

    /** Rebuilds the title and the grid's day cells to match `#viewDate`/`#focusedDate` */
    #renderGrid() {
        const attrs = this.#attrs
        const year = this.#viewDate.getFullYear()
        const month = this.#viewDate.getMonth()
        const firstOfMonth = new Date(year, month, 1)
        const startOffset = firstOfMonth.getDay()
        const gridStart = new Date(year, month, 1 - startOffset)
        const today = new Date()

        this.#titleEl.textContent = this.#viewDate.toLocaleDateString(undefined, {month: "long", year: "numeric"})

        const days = Array.from({length: 42}, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
        const weeks = Array.from({length: 6}, (_, i) => days.slice(i * 7, i * 7 + 7))

        this.#gridEl.replaceChildren(
            <div class="vtd-calendar-weekdays" role="row">
                {weekdayLabels.map(label => <span class="vtd-calendar-weekday" role="columnheader">{label}</span>)}
            </div>,
            ...weeks.map(week => <div class="vtd-calendar-week" role="row">
                {week.map(day => {
                    const outside = day.getMonth() != month
                    const selected = attrs.value ? isSameDay(day, attrs.value) : false
                    const isToday = isSameDay(day, today)
                    const isFocusable = isSameDay(day, this.#focusedDate)
                    return <button
                        type="button"
                        role="gridcell"
                        tabindex={isFocusable ? 0 : -1}
                        class={`vtd-calendar-day${outside ? " vtd-calendar-day-outside" : ""}${selected ? " vtd-calendar-day-selected" : ""}${isToday ? " vtd-calendar-day-today" : ""}`}
                        onClick={() => {
                            this.#focusedDate = day
                            attrs.onSelectDate?.(day)
                        }}>{day.getDate()}</button>
                })}
            </div>),
        )
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
