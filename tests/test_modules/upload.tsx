import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Theme, Upload } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class UploadGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px", display:"flex", flexDirection:"column", gap:"14px"}}>
            <div id="default-upload"><Upload accept="image/*">Click or drag a file here</Upload></div>
            <div><Upload disabled>Disabled</Upload></div>
        </div>
    }
}

class UploadPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><UploadGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><UploadGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><UploadPage/></TestModulePage>, mainPage)
}
