/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {Component, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { Button } from "../form/button.tsx"
import { Tooltip } from "../feedback/tooltip.tsx"
import { CommonThemeOptions } from "../core/theme-options.ts"

/**
 * Attrs type for `<Calendar/>` Component
 */
export type CalendarAttrsType = {
    /** The date selected at first, if any - after that the Calendar keeps its own selection */
    value?: Date
    /** Called when the user picks a day - never for a day outside `min`/`max` */
    onSelectDate?: (date: Date) => void
    /**
     * The days selected at first, for a Calendar that picks several: with `values` set, a click
     * adds a day or takes it away again, rather than moving a single selection
     */
    values?: Date[]
    /** With `values`: called after each click that changes the selection, with every picked day, earliest first */
    onChangeDates?: (dates: Date[]) => void
    /** The earliest day that can be picked. Earlier days still show, so the month reads normally, but can't be selected */
    min?: Date
    /** The latest day that can be picked. Later days still show, but can't be selected */
    max?: Date
    /**
     * Show this many weeks instead of a month, the first being the week today falls in - so the
     * days coming up stay on screen however late in the month it is. Prev/next step that many weeks
     */
    weeks?: number
    /** Accessible names for the prev/next buttons, which show only a glyph */
    prevLabel?: string
    nextLabel?: string
    /**
     * Why the prev/next button is disabled, shown while it is (a `Tooltip` with `whenDisabled`):
     * the paging stops at `min`/`max`, and a reason the consumer knows - "nothing before today",
     * "your plan reaches four weeks ahead" - beats a button that simply stops working
     */
    prevDisabledHint?: RenderableElements
    nextDisabledHint?: RenderableElements
    /**
     * Days to call out - the event a deadline is counting towards, a holiday - each with what it
     * is. A marked day shows a dot under its number, its label on hover, and the label in its
     * accessible name. Marking says nothing about whether it can be picked; that's `min`/`max`.
     */
    marks?: CalendarMarkType[]
} & IdAttr & StylePassthroughAttrs

/**
 * A day a `<Calendar/>` calls out
 */
export type CalendarMarkType = {
    /** The day - its time of day is ignored */
    date: Date
    /** What it is, in the consumer's words - its tooltip, and read out with the day */
    label: string
}

let areCalendarStylesMounted = false

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

/** Does `a` fall on the same calendar day as `b`? */
function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() == b.getDate()
}

/** Days earliest first, one of each */
function sortDays(days: Date[]): Date[] {
    const sorted = [...days].sort((a, b) => startOfDay(a) - startOfDay(b))
    return sorted.filter((d, i) => i === 0 || !isSameDay(d, sorted[i - 1]))
}

function markSelected(cell: HTMLButtonElement, on: boolean): void {
    cell.classList.toggle("vtd-calendar-day-selected", on)
    cell.setAttribute("aria-selected", on ? "true" : "false")
}

/** `date` at local midnight - `min`/`max` bound whole days, whatever time of day they carry */
function startOfDay(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Whole days from `a` to `b` - rounded, since a daylight-saving change makes one day 23 or 25 hours */
function daysBetween(a: Date, b: Date): number {
    return Math.round((startOfDay(b) - startOfDay(a)) / 86400000)
}

function isoDay(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "October – November 2026" for the days from `first` to `last`, naming the year once when it's shared */
export function monthSpanTitle(first: Date, last: Date): string {
    const month = (d: Date, year: boolean) => d.toLocaleDateString(undefined, year ? {month: "long", year: "numeric"} : {month: "long"})
    if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {return month(first, true)}
    return `${month(first, first.getFullYear() !== last.getFullYear())} – ${month(last, true)}`
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
 * **The Calendar owns its selection.** `value` is where it starts; a pick moves the highlight
 * itself and reports the day through `onSelectDate`. It used to leave the highlight on `value`,
 * so every consumer had to rebuild the component on each pick just to show what was picked - a
 * wrapper the showcase carried and anyone else would rediscover. The move is two class toggles,
 * not a rebuilt grid, since nothing else about the month changed.
 *
 * **With `values`, it picks several days** - a run of dates a schedule needs, say. A click toggles
 * one day and `onChangeDates` reports the whole set; `setDates` replaces the set from outside (a
 * list beside the Calendar that can remove a day too) with class toggles, keeping the month on
 * screen where the user left it. The grid says `aria-multiselectable`.
 *
 * **`min`/`max` bound the days that can be picked**, by whole day. Days outside stay rendered
 * and focusable - removing them would break the grid's arrow-key model, and a native `disabled`
 * button can't hold the roving focus - but carry `aria-disabled` and ignore a click or Enter.
 * The prev/next buttons turn off once the screen reaches either bound, since nothing past it can
 * be picked.
 *
 * **With `weeks`, it shows rolling weeks rather than a month.** A month grid on the 28th is four
 * weeks of the past and a few days of the future, which is backwards for picking a day ahead. So
 * the first row is the week today falls in, and prev/next move a page of `weeks` at a time - pages
 * counted from today's week, so a page always starts on the same weekday and paging back returns
 * to exactly where it began. The selection's page is shown first. A day that starts a month says
 * the month ("Nov" over the 1), as does the first day on screen, and the title names the months
 * the page spans.
 *
 * Unlike almost every other stateful `Component` in this package (see the "Avoid refresh()"
 * section of CLAUDE.md), `#header`/`#gridEl` are built once and updated via `#renderGrid()`
 * rather than `this.refresh()`-ing the whole component on every navigation - not for the usual
 * "don't tear down consumer content" reason (a Calendar has none), but because refocusing a day
 * cell after a month change needs a stable element to query the freshly-built grid through, and
 * `refresh()` replaces the component's entire rendered tree out from under any reference to it.
 */
export class Calendar extends Component<CalendarAttrsType> {
    /** First day of the month currently displayed - or with `weeks`, the first day on screen */
    #viewDate: Date
    /** The date that currently holds the grid's roving tabindex/focus */
    #focusedDate: Date
    /** The picked days - `value` (or `values`) at first, then as the user picks; at most one unless `values` is set */
    #selected: Date[]
    #attrs: CalendarAttrsType

    #root: HTMLDivElement
    #titleEl: HTMLSpanElement = <span class="vtd-calendar-title"/>
    #gridEl: HTMLDivElement = <div class="vtd-calendar-grid" role="grid"/>
    #prevButton: HTMLButtonElement
    #nextButton: HTMLButtonElement

    /** Create a new `<Calendar/>` Component */
    constructor(attrs: CalendarAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        const today = new Date()
        this.#selected = attrs.values ? sortDays(attrs.values) : attrs.value ? [attrs.value] : []
        const first = this.#selected[0]
        this.#viewDate = this.#viewStartFor(first ?? today)
        this.#focusedDate = first ?? today
        if (!areCalendarStylesMounted) {
            areCalendarStylesMounted = true
            mountStyles(
`
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
.vtd-calendar-day-outside{opacity:0.35;}
.vtd-calendar-day[aria-disabled="true"]{opacity:0.35;cursor:not-allowed;text-decoration:line-through;}
.vtd-calendar-day[aria-disabled="true"]:hover{background-color:transparent;}
.vtd-calendar-weeks .vtd-calendar-day{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:2.6em;padding:0.25em 0 0.4em;line-height:1.1;}
.vtd-calendar-day-month{font-size:0.65em;font-weight:bold;text-transform:uppercase;letter-spacing:0.03em;opacity:0.75;}
.vtd-calendar-day{position:relative;}
.vtd-calendar-day-marked::after{content:"";position:absolute;left:50%;bottom:0.15em;width:0.35em;height:0.35em;margin-left:-0.175em;border-radius:50%;background-color:var(--accent);}
.vtd-calendar-day-marked[aria-disabled="true"]{text-decoration:none;opacity:0.75;}
` +
/*
 * "Today" is a subtle background tint, not a box-shadow ring - a ring reads too much like a
 * border/selection indicator (it was one, before this was written this way; a demo whose
 * initial value happened to be today made that ring look like a leftover selection outline
 * after picking a different day, since it doesn't - and shouldn't - go away just because
 * something else got selected. Today keeps its own marker regardless of what's selected; the
 * two are meant to coexist, so they need to look clearly different, not just be different
 * classes). --primary-1 (this package's usual "very subtle tint" step, same one Checkbox/
 * RadioButton/Toggle use for their own off-state background) keeps it a background, not text
 * color alone, without competing with -selected's solid --primary fill below.
 */
`
.vtd-calendar-day-today{font-weight:bold;background-color:var(--primary-1);}
.vtd-calendar-day-selected{background-color:var(--primary);color:var(--text-alt);}
` +
/*
 * Both need to win over the plain :hover rule above by specificity (not just source order,
 * which would be one stray reorder away from silently regressing back to this) - otherwise
 * hovering either drops it back to the same neutral background :hover gives every other day,
 * making it indistinguishable from an unselected one for as long as the pointer sits on it.
 */
`
.vtd-calendar-day.vtd-calendar-day-today:hover{background-color:var(--primary-2);}
.vtd-calendar-day.vtd-calendar-day-selected:hover{background-color:var(--primary-6);}
`, "vtd/Calendar")
        }

        this.#gridEl.addEventListener("keydown", this.#handleGridKeyDown)
        if (attrs.values) {this.#gridEl.setAttribute("aria-multiselectable", "true")}

        this.#prevButton = <Button type="text" ariaLabel={attrs.prevLabel} onClick={() => this.#changeView(-1)}><CommonThemeOptions.prevSymbol/></Button>
        this.#nextButton = <Button type="text" ariaLabel={attrs.nextLabel} onClick={() => this.#changeView(1)}><CommonThemeOptions.nextSymbol/></Button>
        this.#root = passthroughAttrsToElement<HTMLDivElement>(<div class={attrs.weeks ? "vtd-calendar vtd-calendar-weeks" : "vtd-calendar"}>
            <div class="vtd-calendar-header">
                {attrs.prevDisabledHint ? <Tooltip whenDisabled placement="bottom-start" content={attrs.prevDisabledHint}>{this.#prevButton}</Tooltip> : this.#prevButton}
                {this.#titleEl}
                {attrs.nextDisabledHint ? <Tooltip whenDisabled placement="bottom-end" content={attrs.nextDisabledHint}>{this.#nextButton}</Tooltip> : this.#nextButton}
            </div>
            {this.#gridEl}
        </div>, attrs)

        this.#renderGrid()
    }

    /** Days on screen with `weeks` - one page */
    #pageDays(): number {
        return Math.max(1, Math.floor(this.#attrs.weeks ?? 0)) * 7
    }

    /**
     * Where the screen starts when it shows `date`: its month's first day, or with `weeks`, the
     * page it falls on - pages run back and forth from the week today is in
     */
    #viewStartFor(date: Date): Date {
        if (!this.#attrs.weeks) {return new Date(date.getFullYear(), date.getMonth(), 1)}
        const today = new Date()
        const anchor = addDays(today, -today.getDay())
        const page = this.#pageDays()
        return addDays(anchor, Math.floor(daysBetween(anchor, date) / page) * page)
    }

    /** The first day the grid shows: the Sunday on or before the month's first, or with `weeks`, the page's */
    #gridStart(): Date {
        if (this.#attrs.weeks) {return this.#viewDate}
        return addDays(this.#viewDate, -this.#viewDate.getDay())
    }

    #isInView(date: Date): boolean {
        if (!this.#attrs.weeks) {
            return date.getFullYear() == this.#viewDate.getFullYear() && date.getMonth() == this.#viewDate.getMonth()
        }
        const offset = daysBetween(this.#viewDate, date)
        return offset >= 0 && offset < this.#pageDays()
    }

    /** Step the screen a month, or a page of `weeks`, and re-render */
    #changeView(delta: number) {
        if (this.#attrs.weeks) {
            const days = delta * this.#pageDays()
            this.#viewDate = addDays(this.#viewDate, days)
            this.#focusedDate = addDays(this.#focusedDate, days)
            this.#renderGrid()
            return
        }
        this.#changeMonth(delta)
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
        if (!this.#isInView(date)) {
            this.#viewDate = this.#viewStartFor(date)
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
        } else if (event.key == "PageUp" || event.key == "PageDown") {
            // A month, or with `weeks` a page; Shift makes it a year either way
            event.preventDefault()
            const sign = event.key == "PageUp" ? -1 : 1
            const next = new Date(this.#focusedDate)
            if (this.#attrs.weeks && !event.shiftKey) {
                next.setDate(next.getDate() + sign * this.#pageDays())
            } else {
                next.setMonth(next.getMonth() + sign * (event.shiftKey ? 12 : 1))
            }
            this.#moveFocusTo(next)
        }
    }

    /** Rebuilds the title and the grid's day cells to match `#viewDate`/`#focusedDate` */
    #renderGrid() {
        const attrs = this.#attrs
        const month = this.#viewDate.getMonth()
        const gridStart = this.#gridStart()
        const today = new Date()
        const count = attrs.weeks ? this.#pageDays() : 42

        const days = Array.from({length: count}, (_, i) => addDays(gridStart, i))
        const weeks = Array.from({length: count / 7}, (_, i) => days.slice(i * 7, i * 7 + 7))

        this.#titleEl.textContent = attrs.weeks
            ? monthSpanTitle(days[0], days[days.length - 1])
            : this.#viewDate.toLocaleDateString(undefined, {month: "long", year: "numeric"})
        // Nothing past a bound can be picked, so there's no paging towards it
        const shownFirst = attrs.weeks ? days[0] : this.#viewDate
        const shownLast = attrs.weeks ? days[days.length - 1] : new Date(this.#viewDate.getFullYear(), month + 1, 0)
        this.#prevButton.disabled = attrs.min !== undefined && startOfDay(shownFirst) <= startOfDay(attrs.min)
        this.#nextButton.disabled = attrs.max !== undefined && startOfDay(shownLast) >= startOfDay(attrs.max)

        this.#gridEl.replaceChildren(
            <div class="vtd-calendar-weekdays" role="row">
                {weekdayLabels.map(label => <span class="vtd-calendar-weekday" role="columnheader">{label}</span>)}
            </div>,
            ...weeks.map(week => <div class="vtd-calendar-week" role="row">
                {week.map(day => {
                    const outside = !attrs.weeks && day.getMonth() != month
                    const labelMonth = attrs.weeks && (day.getDate() === 1 || isSameDay(day, days[0]))
                    const selected = this.#selected.some(s => isSameDay(day, s))
                    const isToday = isSameDay(day, today)
                    const isFocusable = isSameDay(day, this.#focusedDate)
                    const mark = attrs.marks?.find(m => isSameDay(day, m.date))
                    const disabled = (attrs.min !== undefined && startOfDay(day) < startOfDay(attrs.min))
                        || (attrs.max !== undefined && startOfDay(day) > startOfDay(attrs.max))
                    const cell: HTMLButtonElement = <button
                        type="button"
                        role="gridcell"
                        tabindex={isFocusable ? 0 : -1}
                        aria-selected={selected ? "true" : "false"}
                        aria-disabled={disabled ? "true" : undefined}
                        aria-label={`${day.toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric", year: "numeric"})}${mark ? `, ${mark.label}` : ""}`}
                        title={mark?.label}
                        data-date={isoDay(day)}
                        class={`vtd-calendar-day${outside ? " vtd-calendar-day-outside" : ""}${selected ? " vtd-calendar-day-selected" : ""}${isToday ? " vtd-calendar-day-today" : ""}${mark ? " vtd-calendar-day-marked" : ""}`}
                        onClick={() => {
                            this.#focusedDate = day
                            if (disabled) {return}
                            if (attrs.values) {
                                this.#toggle(day, cell)
                                attrs.onChangeDates?.([...this.#selected])
                            } else {
                                this.#select(day, cell)
                            }
                            attrs.onSelectDate?.(day)
                        }}>{labelMonth ? <span class="vtd-calendar-day-month" aria-hidden="true">{day.toLocaleDateString(undefined, {month: "short"})}</span> : null}{day.getDate()}</button>
                    return cell
                })}
            </div>),
        )
    }

    /** Moves the selection to `day`, whose cell is `cell` - two class toggles, not a rebuilt grid */
    #select(day: Date, cell: HTMLButtonElement) {
        if (this.#selected.length === 1 && isSameDay(day, this.#selected[0])) {return}
        this.#selected = [day]
        for (const previous of this.#gridEl.querySelectorAll<HTMLButtonElement>(".vtd-calendar-day-selected")) {
            markSelected(previous, false)
        }
        markSelected(cell, true)
    }

    /** With `values`: adds `day` to the selection, or takes it out - one cell's classes */
    #toggle(day: Date, cell: HTMLButtonElement) {
        const on = !this.#selected.some(s => isSameDay(day, s))
        this.#selected = on ? sortDays([...this.#selected, day]) : this.#selected.filter(s => !isSameDay(day, s))
        markSelected(cell, on)
    }

    /**
     * Replaces the selection - for a list beside the Calendar that changes it too. The month on
     * screen stays put; only cells whose state changed are touched. Days outside `min`/`max` are
     * kept if given, since the caller decided they are picked.
     */
    setDates(dates: Date[]): void {
        this.#selected = this.#attrs.values ? sortDays(dates) : dates.slice(0, 1)
        const gridStart = this.#gridStart()
        const cells = this.#gridEl.querySelectorAll<HTMLButtonElement>(".vtd-calendar-day")
        cells.forEach((cell, i) => {
            const day = addDays(gridStart, i)
            const on = this.#selected.some(s => isSameDay(day, s))
            if (on !== cell.classList.contains("vtd-calendar-day-selected")) {markSelected(cell, on)}
        })
    }

    /** The picked days, earliest first */
    getDates(): Date[] {
        return [...this.#selected]
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
