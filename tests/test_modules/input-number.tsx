import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { InputNumber, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class InputNumberGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-input-number"><InputNumber value={5}/></div>
            <div><InputNumber value={5} min={0} max={10} step={1}/></div>
            <div><InputNumber value={5} disabled/></div>
        </div>
    }
}

class InputNumberPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><InputNumberGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><InputNumberGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><InputNumberPage/></TestModulePage>, mainPage)
}
