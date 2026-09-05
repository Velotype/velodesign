import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Theme, Toggle } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ToggleGallery extends Component<EmptyAttrs> {
    changes = new RenderBasic<number>(0)
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><Toggle id="default-toggle">default toggle</Toggle></div>
            <div style={{marginTop:"10px"}}><Toggle disabled>disabled toggle</Toggle></div>
            <div style={{marginTop:"10px"}}><Toggle checked>checked toggle</Toggle></div>
            <div style={{marginTop:"10px"}}><Toggle disabled checked>disabled + checked toggle</Toggle></div>
            <div style={{marginTop:"10px"}}><Toggle id="clickable-toggle" onChange={()=>{this.changes.value += 1}}>clickable toggle (changed {this.changes} times)</Toggle></div>
        </div>
    }
}

class TogglePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ToggleGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ToggleGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TogglePage/></TestModulePage>, mainPage)
}
