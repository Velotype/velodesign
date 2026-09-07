import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { DatePicker, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class DatePickerGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-datepicker"><DatePicker value="2026-01-15"/></div>
            <div><DatePicker value="2026-01-15" min="2026-01-01" max="2026-12-31"/></div>
            <div><DatePicker disabled value="2026-01-15"/></div>
        </div>
    }
}

class DatePickerPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><DatePickerGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><DatePickerGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><DatePickerPage/></TestModulePage>, mainPage)
}
