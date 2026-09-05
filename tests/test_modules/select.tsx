import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Select, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const fruitOptions = [
    {value: "apple", label: "Apple"},
    {value: "banana", label: "Banana"},
    {value: "cherry", label: "Cherry"},
    {value: "durian", label: "Durian", disabled: true}
]

class SelectGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><Select id="default-select" options={fruitOptions} placeholder="Choose a fruit"/></div>
            <div style={{marginTop:"10px"}}><Select options={fruitOptions} value="banana"/></div>
            <div style={{marginTop:"10px"}}><Select options={fruitOptions} disabled placeholder="Disabled"/></div>
        </div>
    }
}

class SelectPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SelectGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SelectGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SelectPage/></TestModulePage>, mainPage)
}
