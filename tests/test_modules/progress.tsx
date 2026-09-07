import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Progress, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ProgressGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px", display:"flex", flexDirection:"column", gap:"14px"}}>
            <div id="default-progress"><Progress value={40}/></div>
            <div><Progress value={70} showLabel/></div>
            <div><Progress value={100} type="secondary" showLabel/></div>
            <div><Progress value={55} type="warning" showLabel/></div>
            <div><Progress value={20} type="danger" showLabel/></div>
        </div>
    }
}

class ProgressPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ProgressGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ProgressGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ProgressPage/></TestModulePage>, mainPage)
}
