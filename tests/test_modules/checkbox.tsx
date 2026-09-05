import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Checkbox, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class CheckboxGallery extends Component<EmptyAttrs> {
    clicks = new RenderBasic<number>(0)
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><Checkbox id="default-checkbox">default checkbox</Checkbox></div>
            <div style={{marginTop:"10px"}}><Checkbox disabled>disabled checkbox</Checkbox></div>
            <div style={{marginTop:"10px"}}><Checkbox checked>checked checkbox</Checkbox></div>
            <div style={{marginTop:"10px"}}><Checkbox disabled checked>disabled + checked checkbox</Checkbox></div>
            <div style={{marginTop:"10px"}}><Checkbox indeterminate>indeterminate checkbox</Checkbox></div>
            <div style={{marginTop:"10px"}}><Checkbox id="clickable-checkbox" onChange={()=>{this.clicks.value += 1}}>clickable checkbox (changed {this.clicks} times)</Checkbox></div>
        </div>
    }
}

class CheckboxPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CheckboxGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CheckboxGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CheckboxPage/></TestModulePage>, mainPage)
}
