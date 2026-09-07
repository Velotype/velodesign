import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Sidebar, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class SidebarGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <div id="default-sidebar" style={{display:"flex", border:"1px dashed var(--background-5)", maxWidth:"280px"}}>
                <Sidebar header="Sections" items={[
                    {label: "Overview", to: "/sidebar"},
                    {label: "Settings", to: "/sidebar/settings"},
                    {label: "Billing", to: "/sidebar/billing"}
                ]}/>
            </div>
        </div>
    }
}

class SidebarPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SidebarGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SidebarGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SidebarPage/></TestModulePage>, mainPage)
}
