import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { DateTimeRangePicker, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class DateTimeRangePickerGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-datetimerangepicker"><DateTimeRangePicker value={{start: "2026-01-15T09:30", end: "2026-01-17T17:00"}} onChange={()=>{}}/></div>
            <div><DateTimeRangePicker disabled value={{start: "2026-01-15T09:30", end: "2026-01-17T17:00"}}/></div>
        </div>
    }
}

class DateTimeRangePickerPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><DateTimeRangePickerGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><DateTimeRangePickerGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><DateTimeRangePickerPage/></TestModulePage>, mainPage)
}
