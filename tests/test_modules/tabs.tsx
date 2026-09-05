import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Tabs, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const sampleTabs = [
    {key: "one", label: "First", content: "Content of the first tab."},
    {key: "two", label: "Second", content: "Content of the second tab."},
    {key: "three", label: "Third", content: "Content of the third tab."}
]

class TabsGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px"}}>
            <Tabs id="default-tabs" tabs={sampleTabs}/>
        </div>
    }
}

class TabsPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TabsGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TabsGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TabsPage/></TestModulePage>, mainPage)
}
