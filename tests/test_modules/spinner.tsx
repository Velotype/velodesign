import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Spinner, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class SpinnerGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display: "flex", alignItems: "center", gap: "12px"}}>
            <Spinner id="default-spinner"/>
            <Spinner size="1.5em"/>
            <Spinner size="2.5em"/>
            <span style={{color: "var(--accent)"}}><Spinner/> (inherits surrounding color)</span>
        </div>
    }
}

class SpinnerPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SpinnerGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SpinnerGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SpinnerPage/></TestModulePage>, mainPage)
}
