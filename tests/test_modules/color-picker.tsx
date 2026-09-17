import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { ColorPicker, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ColorPickerGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", gap:"10px"}}>
            <div id="default-colorpicker"><ColorPicker value="#66b2ff"/></div>
            <div><ColorPicker value="#ff6666" disabled/></div>
        </div>
    }
}

class ColorPickerPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ColorPickerGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ColorPickerGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ColorPickerPage/></TestModulePage>, mainPage)
}
