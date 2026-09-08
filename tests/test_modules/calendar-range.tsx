import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { CalendarRange, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class CalendarRangeGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <div id="default-calendar-range"><CalendarRange value={{start: new Date(2026, 0, 10), end: new Date(2026, 0, 15)}} onSelectRange={()=>{}}/></div>
        </div>
    }
}

class CalendarRangePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CalendarRangeGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CalendarRangeGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CalendarRangePage/></TestModulePage>, mainPage)
}
