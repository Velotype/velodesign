import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { DateTimePicker, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class DateTimePickerGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-datetimepicker"><DateTimePicker value="2026-01-15T09:30"/></div>
            <div><DateTimePicker value="2026-01-15T09:30" min="2026-01-01T00:00" max="2026-12-31T23:59"/></div>
            <div><DateTimePicker disabled value="2026-01-15T09:30"/></div>
        </div>
    }
}

class DateTimePickerPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><DateTimePickerGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><DateTimePickerGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><DateTimePickerPage/></TestModulePage>, mainPage)
}
