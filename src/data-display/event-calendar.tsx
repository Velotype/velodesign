/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {Component, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { Button } from "../form/button.tsx"
import { CommonThemeOptions } from "../core/theme-options.ts"

/** The colour an event is drawn in - a palette name, like `Badge`'s `type` */
export type EventCalendarEventColorType = "primary" | "secondary" | "warning" | "danger" | "neutral"

/** One thing on an `<EventCalendar/>` - it falls on one day; something spanning several is one event per day */
export type EventCalendarEventType = {
    /** The day it falls on, in local time - the time of day only matters for ordering within the day */
    date: Date
    /** What it is */
    label: string
    /** Shown before the label, when the event has a time worth saying ("2pm") - already formatted, since only the consumer knows how */
    time?: string
    /** Where the event goes: rendered as a link. Without it the event is a button that only calls `onSelectEvent` */
    href?: string
    /** Its colour, default `"primary"` */
    type?: EventCalendarEventColorType
}

/**
 * Attrs type for `<EventCalendar/>` Component
 */
export type EventCalendarAttrsType = {
    /** Everything to show, in any order. `setEvents` replaces them later */
    events: EventCalendarEventType[]
    /** A day in the month shown first - default this month */
    month?: Date
    /** Called when an event is clicked, with the click - `preventDefault()` it to route an `href` yourself */
    onSelectEvent?: (event: EventCalendarEventType, click: MouseEvent) => void
    /** Called after the month on screen changes, with its first day - to fetch that month's events, say */
    onChangeMonth?: (month: Date) => void
    /** How many events a day shows before the rest fold behind a "+N" button, default 3 */
    maxPerDay?: number
    /** The folded-events button's content, given how many are folded - default `+N` */
    moreLabel?: (hidden: number) => RenderableElements
    /** Shown in the list layout for a month with nothing in it - a factory, since it is built again each month. Default `CommonThemeOptions.emptySymbol` */
    emptyMessage?: () => RenderableElements
    /** The weekday a week starts on, 0 (Sunday, the default) to 6 */
    weekStartsOn?: number
    /** `"auto"` (the default) shows the month grid, and a list of the days with events once the calendar is narrower than 36em; the others fix one */
    layout?: "auto" | "grid" | "list"
    /** Accessible names for the previous/next month buttons, which show only a glyph */
    prevMonthLabel?: string
    nextMonthLabel?: string
} & IdAttr & StylePassthroughAttrs

let areEventCalendarStylesMounted = false

/** `y-m-d` of a local date, the key events are grouped by */
function dayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function isoDay(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * A month of events - a wall calendar, where `Calendar` is a date picker. Each day lists what falls
 * on it, earliest first, as links (or buttons); a busy day folds the rest behind a "+N" button
 * that unfolds that one day in place.
 *
 * **A narrow calendar becomes a list.** Seven columns don't fit a phone with any text in them, so
 * below 36em of its *own* width (a container query, so it follows wherever the consumer puts it,
 * not the viewport) it lists only the days with events, each under its date. Both layouts are
 * built with the month and CSS shows one - nothing is measured, and a resize does no DOM work.
 *
 * **Changing month rebuilds only the month.** The header is built once; the prev/next buttons
 * write the title's text node and replace `#monthEl`'s children. Unfolding a day is one class.
 * Weekday names and the title come from `Intl`, in the reader's locale, so nothing here is English.
 */
export class EventCalendar extends Component<EventCalendarAttrsType> {
    #attrs: EventCalendarAttrsType
    #events: EventCalendarEventType[]
    /** First day of the month on screen */
    #viewDate: Date

    #root: HTMLDivElement
    #titleText: Text = document.createTextNode("")
    #monthEl: HTMLDivElement = <div class="vtd-event-calendar-month"/>

    /** Create a new `<EventCalendar/>` Component */
    constructor(attrs: EventCalendarAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        this.#events = attrs.events
        const start = attrs.month ?? new Date()
        this.#viewDate = new Date(start.getFullYear(), start.getMonth(), 1)
        if (!areEventCalendarStylesMounted) {
            areEventCalendarStylesMounted = true
            mountStyles(
`
.vtd-event-calendar{width:100%;box-sizing:border-box;container-type:inline-size;}
.vtd-event-calendar-header{display:flex;align-items:center;gap:0.5em;margin-block-end:0.5em;}
.vtd-event-calendar-title{font-weight:bold;font-size:1.1em;flex:1;text-align:center;}
.vtd-event-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--background-4);border-left:1px solid var(--background-4);}
.vtd-event-calendar-weekday{font-size:0.8em;opacity:0.7;padding:0.3em 0.4em;text-align:start;border-right:1px solid var(--background-4);border-bottom:1px solid var(--background-4);}
.vtd-event-calendar-day{min-height:6.5em;padding:0.25em;box-sizing:border-box;border-right:1px solid var(--background-4);border-bottom:1px solid var(--background-4);min-width:0;}
.vtd-event-calendar-day-outside{background-color:var(--background-1);}
.vtd-event-calendar-day-outside .vtd-event-calendar-date{opacity:0.5;}
.vtd-event-calendar-date{display:inline-block;min-width:1.7em;padding:0.1em 0.3em;border-radius:1em;text-align:center;font-size:0.85em;box-sizing:border-box;}
.vtd-event-calendar-day-today .vtd-event-calendar-date{background-color:var(--primary);color:var(--text-alt);font-weight:bold;}
.vtd-event-calendar-events{list-style:none;margin:0.2em 0 0;padding:0;display:flex;flex-direction:column;gap:0.15em;}
.vtd-event-calendar-event{display:block;width:100%;box-sizing:border-box;text-align:start;padding:0.15em 0.4em;border-radius:0.25rem;border:none;font:inherit;font-size:0.8em;line-height:1.3;color:var(--text);text-decoration:none;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.vtd-event-calendar-event-time{font-weight:bold;margin-inline-end:0.3em;}
.vtd-event-calendar-event-primary{background-color:var(--primary-3);}
.vtd-event-calendar-event-primary:hover{background-color:var(--primary-4);}
.vtd-event-calendar-event-secondary{background-color:var(--secondary-3);}
.vtd-event-calendar-event-secondary:hover{background-color:var(--secondary-4);}
.vtd-event-calendar-event-warning{background-color:var(--warning-3);}
.vtd-event-calendar-event-warning:hover{background-color:var(--warning-4);}
.vtd-event-calendar-event-danger{background-color:var(--accent-3);}
.vtd-event-calendar-event-danger:hover{background-color:var(--accent-4);}
.vtd-event-calendar-event-neutral{background-color:var(--background-1);box-shadow:inset 0 0 0 1px var(--background-5);}
.vtd-event-calendar-event-neutral:hover{background-color:var(--background-2);}
.vtd-event-calendar-day:not(.vtd-event-calendar-day-expanded) .vtd-event-calendar-folded{display:none;}
.vtd-event-calendar-day-expanded .vtd-event-calendar-more{display:none;}
.vtd-event-calendar-more{border:none;background:transparent;color:inherit;font:inherit;font-size:0.8em;padding:0.1em 0.4em;cursor:pointer;opacity:0.8;border-radius:0.25rem;}
.vtd-event-calendar-more:hover{background-color:var(--background-2);opacity:1;}
.vtd-event-calendar-list{list-style:none;margin:0;padding:0;display:none;}
.vtd-event-calendar-list-day{display:flex;gap:0.75em;padding-block:0.6em;border-bottom:1px solid var(--background-4);}
.vtd-event-calendar-list-day .vtd-event-calendar-date{font-size:1em;min-width:2.2em;}
.vtd-event-calendar-list-day .vtd-event-calendar-events{flex:1;min-width:0;margin:0;}
.vtd-event-calendar-list-day .vtd-event-calendar-event{font-size:0.95em;white-space:normal;padding:0.35em 0.6em;}
.vtd-event-calendar-list-weekday{display:block;font-size:0.75em;opacity:0.7;text-align:center;}
.vtd-event-calendar-empty{display:none;padding:1em 0;text-align:center;opacity:0.7;}
.vtd-event-calendar-layout-list .vtd-event-calendar-grid{display:none;}
.vtd-event-calendar-layout-list .vtd-event-calendar-list{display:block;}
.vtd-event-calendar-layout-list .vtd-event-calendar-empty{display:block;}
@container (max-width: 36em){
.vtd-event-calendar-layout-auto .vtd-event-calendar-grid{display:none;}
.vtd-event-calendar-layout-auto .vtd-event-calendar-list{display:block;}
.vtd-event-calendar-layout-auto .vtd-event-calendar-empty{display:block;}
}
`, "vtd/EventCalendar")
        }

        this.#root = passthroughAttrsToElement<HTMLDivElement>(<div class={`vtd-event-calendar vtd-event-calendar-layout-${attrs.layout ?? "auto"}`}>
            <div class="vtd-event-calendar-header">
                <Button type="text" ariaLabel={attrs.prevMonthLabel} onClick={() => this.#changeMonth(-1)}><CommonThemeOptions.prevSymbol/></Button>
                <span class="vtd-event-calendar-title" aria-live="polite">{this.#titleText}</span>
                <Button type="text" ariaLabel={attrs.nextMonthLabel} onClick={() => this.#changeMonth(1)}><CommonThemeOptions.nextSymbol/></Button>
            </div>
            {this.#monthEl}
        </div>, attrs)

        this.#renderMonth()
    }

    #changeMonth(delta: number) {
        this.setMonth(new Date(this.#viewDate.getFullYear(), this.#viewDate.getMonth() + delta, 1))
        this.#attrs.onChangeMonth?.(new Date(this.#viewDate))
    }

    /** One event, as a link or a button */
    #event(event: EventCalendarEventType, folded: boolean): HTMLLIElement {
        const cls = `vtd-event-calendar-event vtd-event-calendar-event-${event.type ?? "primary"}`
        const content = [event.time ? <span class="vtd-event-calendar-event-time">{event.time}</span> : null, event.label]
        const onClick = (click: MouseEvent) => this.#attrs.onSelectEvent?.(event, click)
        const title = event.time ? `${event.time} ${event.label}` : event.label
        return <li class={folded ? "vtd-event-calendar-folded" : undefined}>
            {event.href
                ? <a class={cls} href={event.href} title={title} onClick={onClick}>{content}</a>
                : <button type="button" class={cls} title={title} onClick={onClick}>{content}</button>}
        </li>
    }

    /** Rebuilds the title and both layouts for `#viewDate` - the only DOM a month change touches */
    #renderMonth() {
        const year = this.#viewDate.getFullYear()
        const month = this.#viewDate.getMonth()
        const weekStart = ((this.#attrs.weekStartsOn ?? 0) % 7 + 7) % 7
        const maxPerDay = Math.max(1, this.#attrs.maxPerDay ?? 3)
        const today = dayKey(new Date())

        this.#titleText.nodeValue = this.#viewDate.toLocaleDateString(undefined, {month: "long", year: "numeric"})

        const byDay = new Map<string, EventCalendarEventType[]>()
        for (const event of [...this.#events].sort((a, b) => a.date.getTime() - b.date.getTime())) {
            const key = dayKey(event.date)
            byDay.set(key, [...(byDay.get(key) ?? []), event])
        }

        const offset = (new Date(year, month, 1).getDay() - weekStart + 7) % 7
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const weeks = Math.ceil((offset + daysInMonth) / 7)
        const days = Array.from({length: weeks * 7}, (_, i) => new Date(year, month, 1 - offset + i))
        const weekdayName = (d: Date, style: "short" | "long") => d.toLocaleDateString(undefined, {weekday: style})

        const grid = <div class="vtd-event-calendar-grid">
            {days.slice(0, 7).map(d => <div class="vtd-event-calendar-weekday" aria-hidden="true">{weekdayName(d, "short")}</div>)}
            {days.map(day => {
                const events = byDay.get(dayKey(day)) ?? []
                const outside = day.getMonth() !== month
                const cell: HTMLDivElement = <div class={`vtd-event-calendar-day${outside ? " vtd-event-calendar-day-outside" : ""}${dayKey(day) === today ? " vtd-event-calendar-day-today" : ""}`}>
                    <time class="vtd-event-calendar-date" datetime={isoDay(day)} aria-label={day.toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"})}>{day.getDate()}</time>
                    {events.length > 0 ? <ul class="vtd-event-calendar-events">{events.map((e, i) => this.#event(e, i >= maxPerDay))}</ul> : null}
                    {events.length > maxPerDay
                        ? <button type="button" class="vtd-event-calendar-more" onClick={() => cell.classList.add("vtd-event-calendar-day-expanded")}>
                            {this.#attrs.moreLabel ? this.#attrs.moreLabel(events.length - maxPerDay) : `+${events.length - maxPerDay}`}
                        </button>
                        : null}
                </div>
                return cell
            })}
        </div>

        const listed = days.filter(d => d.getMonth() === month && byDay.has(dayKey(d)))
        const list = <ol class="vtd-event-calendar-list">
            {listed.map(day => <li class={`vtd-event-calendar-list-day${dayKey(day) === today ? " vtd-event-calendar-day-today" : ""}`}>
                <div>
                    <span class="vtd-event-calendar-list-weekday" aria-hidden="true">{weekdayName(day, "short")}</span>
                    <time class="vtd-event-calendar-date" datetime={isoDay(day)} aria-label={day.toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"})}>{day.getDate()}</time>
                </div>
                <ul class="vtd-event-calendar-events">{(byDay.get(dayKey(day)) ?? []).map(e => this.#event(e, false))}</ul>
            </li>)}
        </ol>

        this.#monthEl.replaceChildren(grid, list,
            listed.length === 0 ? <div class="vtd-event-calendar-empty">{this.#attrs.emptyMessage ? this.#attrs.emptyMessage() : <CommonThemeOptions.emptySymbol/>}</div> : "")
    }

    /** Replaces the events, redrawing the month on screen */
    setEvents(events: EventCalendarEventType[]): void {
        this.#events = events
        this.#renderMonth()
    }

    /** Shows the month `date` falls in - without calling `onChangeMonth`, since the caller chose it */
    setMonth(date: Date): void {
        const next = new Date(date.getFullYear(), date.getMonth(), 1)
        if (next.getTime() === this.#viewDate.getTime()) {return}
        this.#viewDate = next
        this.#renderMonth()
    }

    /** The first day of the month on screen */
    getMonth(): Date {
        return new Date(this.#viewDate)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
