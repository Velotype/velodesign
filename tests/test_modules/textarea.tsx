import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Textarea, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TextareaGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><Textarea id="default-textarea" placeholder="type here..."/></div>
            <div style={{marginTop:"10px"}}><Textarea value="starting value" rows={5}/></div>
            <div style={{marginTop:"10px"}}><Textarea value="cannot be resized" resize="none"/></div>
        </div>
    }
}

class TextareaPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TextareaGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TextareaGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TextareaPage/></TestModulePage>, mainPage)
}
