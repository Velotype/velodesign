import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Calendar, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class CalendarGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <div id="default-calendar"><Calendar value={new Date(2026, 0, 15)} onSelectDate={(date) => {
                (globalThis as unknown as {__picked: string[]}).__picked = [...((globalThis as unknown as {__picked?: string[]}).__picked ?? []), date.toDateString()]
            }}/></div>
            {/* Only the 10th to the 20th can be picked: a deadline that must fall before an event, say */}
            <div id="bounded-calendar" style={{marginTop: "1em"}}><Calendar value={new Date(2026, 0, 15)} min={new Date(2026, 0, 10)} max={new Date(2026, 0, 20, 18, 30)}/></div>
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
