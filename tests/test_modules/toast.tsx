import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, setThemeOnSelector, showToast, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ToastGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display: "flex", gap: "12px", flexWrap: "wrap"}}>
            <Button id="toast-info-btn" type="secondary" onClick={()=>{showToast("An info message")}}>Show info toast</Button>
            <Button id="toast-success-btn" type="secondary" onClick={()=>{showToast("Saved successfully", {type: "success"})}}>Show success toast</Button>
            <Button id="toast-warning-btn" type="secondary" onClick={()=>{showToast("Careful now", {type: "warning"})}}>Show warning toast</Button>
            <Button id="toast-danger-btn" type="secondary" onClick={()=>{showToast("Something went wrong", {type: "danger"})}}>Show danger toast</Button>
            <Button id="toast-quick-btn" type="secondary" onClick={()=>{showToast("Gone in a flash", {duration: 500})}}>Show quick toast (500ms)</Button>
            <Button id="toast-sticky-btn" type="secondary" onClick={()=>{showToast("Stays until dismissed", {duration: 0})}}>Show sticky toast</Button>
        </div>
    }
}

class ToastPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ToastGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ToastGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ToastPage/></TestModulePage>, mainPage)
}
