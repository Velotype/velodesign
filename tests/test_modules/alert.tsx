import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Alert, setThemeOnSelector, Theme } from "../../src/index.ts"
import type { AlertType } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const alertTypes: AlertType[] = ["info", "success", "warning", "danger"]

class AlertGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            {alertTypes.map(type => <div style={{marginTop:"10px"}}><Alert type={type} title={`${type} alert`}>This is a {type} message.</Alert></div>)}
            <div style={{marginTop:"10px"}}><Alert type="info" onDismiss={()=>{}}>dismissible alert</Alert></div>
        </div>
    }
}

class AlertPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><AlertGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><AlertGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><AlertPage/></TestModulePage>, mainPage)
}
