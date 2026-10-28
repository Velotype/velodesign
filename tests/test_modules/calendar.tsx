import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Calendar, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/** Today plus `days`, at midnight */
function inDays(days: number): Date {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
}

class CalendarGallery extends Component<EmptyAttrs> {
    override render() {
        const multiple = getComponent<Calendar>(<Calendar values={[new Date(2026, 0, 15), new Date(2026, 0, 16)]} onChangeDates={(dates) => {
            (globalThis as unknown as {__days: string[]}).__days = dates.map(d => String(d.getDate()))
        }}/>)
        return <div style={{marginTop:"10px"}}>
            <div id="default-calendar"><Calendar value={new Date(2026, 0, 15)} onSelectDate={(date) => {
                (globalThis as unknown as {__picked: string[]}).__picked = [...((globalThis as unknown as {__picked?: string[]}).__picked ?? []), date.toDateString()]
            }}/></div>
            {/* Only the 10th to the 20th can be picked: a deadline that must fall before an event, say */}
            <div id="bounded-calendar" style={{marginTop: "1em"}}><Calendar value={new Date(2026, 0, 15)} min={new Date(2026, 0, 10)} max={new Date(2026, 0, 20, 18, 30)}/></div>
            {/* Rolling weeks: this week first, eight weeks of reach - relative to today, so the test computes where things sit */}
            <div id="weeks-calendar" style={{marginTop: "1em"}}><Calendar weeks={4} min={new Date()} max={inDays(56)} prevLabel="Earlier weeks" nextLabel="Later weeks"
                prevDisabledHint="Nothing before this week" nextDisabledHint="Eight weeks ahead at most"/></div>
            {/* A picked day five weeks out opens on its page */}
            <div id="weeks-later-calendar" style={{marginTop: "1em"}}><Calendar weeks={4} value={inDays(40)}/></div>
            {/* A deadline before an event: the event's day marked, and past max */}
            <div id="marked-calendar" style={{marginTop: "1em"}}><Calendar value={new Date(2026, 0, 15)} max={new Date(2026, 0, 19)} marks={[{date: new Date(2026, 0, 20, 18, 0), label: "The party"}]}/></div>
            {/* Several days: a click toggles one; "Clear" sets the selection from outside */}
            <div id="multiple-calendar" style={{marginTop: "1em"}}>{multiple}
                <Button id="multiple-clear" type="secondary" onClick={() => multiple.setDates([])}>Clear</Button>
            </div>
        </div>
    }
}

class CalendarPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CalendarGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CalendarGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CalendarPage/></TestModulePage>, mainPage)
}
