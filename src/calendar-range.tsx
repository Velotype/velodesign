import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"

/** A (possibly incomplete) date range, as picked by `<CalendarRange/>` */
export type DateRangeType = {
    /** Start of the range (inclusive) */
    start?: Date
    /** End of the range (inclusive) */
    end?: Date
}

/**
 * Attrs type for `<CalendarRange/>` Component
 */
export type CalendarRangeAttrsType = {
    /** Currently selected range, if any */
    value?: DateRangeType
    /** Called every time the range changes - once when the start is picked (with `end`
     * `undefined`), and again once the end is picked completing the range */
    onSelectRange?: (range: DateRangeType) => void
} & IdAttr & StylePassthroughAttrs

let areCalendarRangeStylesMounted = false

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

/** Does `a` fall on the same calendar day as `b`? */
function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() == b.getDate()
}

/** Midnight-normalized so range comparisons only ever look at the calendar day, never time-of-day */
function atMidnight(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * A month-grid date-range picker: the same prev/next-month grid as `Calendar`, but clicking
 * picks a *start* then an *end* instead of a single day - the whole span between them (and
 * both endpoints) highlights once both are picked.
 *
 * A separate component from `Calendar` rather than a "range mode" flag on it: the two have
 * meaningfully different attrs (`value`/`onSelectRange` vs. `value`/`onSelectDate`) and click
 * semantics (two-step start/end picking, chronological reordering if the second pick lands
 * before the first, vs. a single immediate pick), and folding both into one component's attrs
 * would mean every consumer paying for a union type that's only ever half-relevant to them.
 * They intentionally share the `vtd-calendar-*` class names for the grid/day-cell structure
 * they render identically, each under its own `setStylesheet` key (see CLAUDE.md's Styling
 * section) - not a shared stylesheet, but the same visual language.
 *
 * Picking logic: the first click after a range is complete (or after nothing is picked yet)
 * starts a new range and clears the end. The next click completes it, chronologically -
 * clicking a day *before* the picked start swaps them so `start` is always the earlier date.
 * `onSelectRange` fires on both the start-only pick and the completing pick, so a consumer that
 * only cares about complete ranges should check `range.end !== undefined`.
 *
 * Keyboard model matches `Calendar` exactly (see its own doc comment for the full ARIA APG
 * grid rationale) - Enter/Space (native button activation) on the focused day cell does
 * whichever of "start" or "complete" a click would have done.
 */
export class CalendarRange extends Component<CalendarRangeAttrsType> {
    /** First day of the month currently displayed */
    #viewDate: Date
    /** The date that currently holds the grid's roving tabindex/focus */
    #focusedDate: Date
    /** The range picked so far - distinct from `#attrs.value` so this stays the source of
     * truth for an uncontrolled consumer that never passes `value` back in at all */
    #range: DateRangeType
    #attrs: CalendarRangeAttrsType

    #root: HTMLDivElement
    #titleEl: HTMLSpanElement = <span class="vtd-calendar-title"/>
    #gridEl: HTMLDivElement = <div class="vtd-calendar-grid" role="grid"/>

    /** Create a new `<CalendarRange/>` Component */
    constructor(attrs: CalendarRangeAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        this.#range = attrs.value ?? {}
        const today = new Date()
        const anchor = this.#range.start ?? today
        this.#viewDate = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
        this.#focusedDate = anchor
        if (!areCalendarRangeStylesMounted) {
            areCalendarRangeStylesMounted = true
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
/* See Calendar's identical comment for the full rationale - a subtle background tint instead of
 * a box-shadow ring, so "today" never reads as a leftover selection/range outline. */
.vtd-calendar-day-today{font-weight:bold;background-color:var(--primary-1);}
.vtd-calendar-day-in-range{background-color:var(--primary-3);border-radius:0;}
.vtd-calendar-day-range-start,.vtd-calendar-day-range-end{background-color:var(--primary);color:var(--text-alt);}
.vtd-calendar-day-range-start{border-start-end-radius:0;border-end-end-radius:0;}
.vtd-calendar-day-range-end{border-start-start-radius:0;border-end-start-radius:0;}
/*
 * All need to win over the plain :hover rule above by specificity (not source order, which
 * would be one stray reorder away from silently regressing) - otherwise hovering any of them
 * drops it back to the same neutral background :hover gives an ordinary day, making it
 * indistinguishable from an unselected day for as long as the pointer sits on it - see
 * Calendar's identical -selected:hover fix.
 */
.vtd-calendar-day.vtd-calendar-day-today:hover{background-color:var(--primary-2);}
.vtd-calendar-day.vtd-calendar-day-in-range:hover{background-color:var(--primary-4);}
.vtd-calendar-day.vtd-calendar-day-range-start:hover,.vtd-calendar-day.vtd-calendar-day-range-end:hover{background-color:var(--primary-6);}
`, "vtd/CalendarRange")
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
     * rebuilding the grid) if `date` falls outside it - see `Calendar#moveFocusTo` for why */
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

    /** Applies a click/activation on `day` to the in-progress range, reordering into
     * chronological order if needed, and notifies the consumer */
    #pickDay(day: Date) {
        const picked = atMidnight(day)
        if (!this.#range.start || this.#range.end) {
            this.#range = {start: picked, end: undefined}
        } else if (picked < this.#range.start) {
            this.#range = {start: picked, end: this.#range.start}
        } else {
            this.#range = {start: this.#range.start, end: picked}
        }
        this.#focusedDate = day
        this.#attrs.onSelectRange?.(this.#range)
        this.#renderGrid()
    }

    /** Rebuilds the title and the grid's day cells to match `#viewDate`/`#focusedDate`/`#range` */
    #renderGrid() {
        const year = this.#viewDate.getFullYear()
        const month = this.#viewDate.getMonth()
        const firstOfMonth = new Date(year, month, 1)
        const startOffset = firstOfMonth.getDay()
        const gridStart = new Date(year, month, 1 - startOffset)
        const today = new Date()
        const {start, end} = this.#range

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
                    const isToday = isSameDay(day, today)
                    const isFocusable = isSameDay(day, this.#focusedDate)
                    const isStart = start ? isSameDay(day, start) : false
                    const isEnd = end ? isSameDay(day, end) : false
                    const inRange = start && end ? atMidnight(day) > start && atMidnight(day) < end : false
                    const classes = [
                        "vtd-calendar-day",
                        outside && "vtd-calendar-day-outside",
                        isToday && "vtd-calendar-day-today",
                        inRange && "vtd-calendar-day-in-range",
                        isStart && "vtd-calendar-day-range-start",
                        isEnd && "vtd-calendar-day-range-end",
                    ].filter(Boolean).join(" ")
                    return <button
                        type="button"
                        role="gridcell"
                        tabindex={isFocusable ? 0 : -1}
                        class={classes}
                        aria-pressed={isStart || isEnd}
                        onClick={() => this.#pickDay(day)}>{day.getDate()}</button>
                })}
            </div>),
        )
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
