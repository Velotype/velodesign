import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Breadcrumbs, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class BreadcrumbsGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <Breadcrumbs id="default-breadcrumbs" spa items={[
                {label: "Home", to: "/breadcrumbs"},
                {label: "Section", to: "/breadcrumbs#section"},
                {label: "Current page"}
            ]}/>
            <div style={{marginTop:"10px"}}>
                <Breadcrumbs spa items={[{label: "Home", to: "/breadcrumbs"}, {label: "Current"}]} separator=">"/>
            </div>
        </div>
    }
}

class BreadcrumbsPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><BreadcrumbsGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><BreadcrumbsGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><BreadcrumbsPage/></TestModulePage>, mainPage)
}
