import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Steps, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const stepsList = [
    {key: "a", title: "Account", description: "Create your account"},
    {key: "b", title: "Profile", description: "Fill in your details"},
    {key: "c", title: "Confirm", description: "Review and submit"},
]

class StepsGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "480px", display:"flex", flexDirection:"column", gap:"24px"}}>
            <div id="default-steps"><Steps steps={stepsList} current={1}/></div>
            <div><Steps steps={stepsList} current={0}/></div>
            <div><Steps steps={stepsList} current={2}/></div>
        </div>
    }
}

class StepsPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><StepsGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><StepsGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><StepsPage/></TestModulePage>, mainPage)
}
