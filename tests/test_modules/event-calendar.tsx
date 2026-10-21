import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, EventCalendar, setThemeOnSelector, Theme } from "../../src/index.ts"
import type { EventCalendarEventType } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/** January 2026, which starts on a Thursday - fixed so the tests know where each day sits */
const on = (day: number, hour = 9) => new Date(2026, 0, day, hour)

/** A factory, not a constant: each gallery column builds its own (CLAUDE.md, gotcha 7) */
function events(): EventCalendarEventType[] {
    return [
        {date: on(8, 12), label: "Teacher lunch", time: "12pm", type: "warning"},
        {date: on(8, 9), label: "Bake sale", time: "9am", href: "#bake-sale"},
        {date: on(8, 11), label: "Car wash", time: "11am", type: "secondary"},
        {date: on(8, 15), label: "Book fair", time: "3pm", type: "neutral"},
        {date: on(15), label: "Potluck", type: "secondary"},
        {date: on(28), label: "Forms due", type: "danger"},
        {date: on(29), label: "Meeting (option)", tentative: true},
    ]
}

class EventCalendarGallery extends Component<EmptyAttrs> {
    override render() {
        const settable = getComponent<EventCalendar>(<EventCalendar month={on(1)} layout="grid" events={[]}/>)
        return <div style={{marginTop: "10px"}}>
            <div id="default-event-calendar"><EventCalendar month={on(1)} maxPerDay={2} events={events()} layout="grid"
                onSelectEvent={(event, click) => {
                    click.preventDefault()
                    ;(globalThis as unknown as {__selected: string[]}).__selected = [...((globalThis as unknown as {__selected?: string[]}).__selected ?? []), event.label]
                }}
                onChangeMonth={(month) => {(globalThis as unknown as {__month: string}).__month = month.toDateString()}}/></div>
            {/* The list layout - what a narrow calendar shows */}
            <div id="list-event-calendar" style={{marginTop: "1em"}}><EventCalendar month={on(1)} events={events()} layout="list"/></div>
            {/* Auto, in a narrow container: the container query picks the list */}
            <div id="narrow-event-calendar" style={{marginTop: "1em", width: "300px"}}><EventCalendar month={on(1)} events={events()}/></div>
            {/* Weeks starting on Monday */}
            <div id="monday-event-calendar" style={{marginTop: "1em"}}><EventCalendar month={on(1)} weekStartsOn={1} layout="grid" events={events()}/></div>
            {/* Events set from outside */}
            <div id="settable-event-calendar" style={{marginTop: "1em"}}>{settable}
                <Button id="settable-add" type="secondary" onClick={() => settable.setEvents([{date: on(20), label: "Added"}])}>Add one</Button>
            </div>
        </div>
    }
}

class EventCalendarPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding: "8px", flexGrow: 1, flexBasis: "0", minWidth: "0", minHeight: "100vh"}}><EventCalendarGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding: "8px", flexGrow: 1, flexBasis: "0", minWidth: "0"}}><EventCalendarGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><EventCalendarPage/></TestModulePage>, mainPage)
}
