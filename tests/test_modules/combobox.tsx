import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Combobox, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ComboboxGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-combobox"><Combobox
                placeholder="Choose a fruit"
                options={[{value: "Apple"}, {value: "Banana"}, {value: "Cherry"}, {value: "Date"}]}/></div>
        </div>
    }
}

class ComboboxPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ComboboxGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ComboboxGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ComboboxPage/></TestModulePage>, mainPage)
}
