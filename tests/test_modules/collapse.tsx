import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Collapse, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class CollapseGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-collapse"><Collapse header="Click to expand">Hidden content revealed on expand.</Collapse></div>
            <div><Collapse header="Starts open" defaultOpen>This section starts expanded.</Collapse></div>
            <div id="side-by-side-collapse" style={{display:"flex", gap:"10px"}}>
                <Collapse header="Narrow">Short.</Collapse>
                <Collapse header="Wide">A much longer line of body content than the header, to check that the collapsed and expanded widths stay the same.</Collapse>
            </div>
            <div id="long-header-collapse"><Collapse header="A deliberately long header, to check the minimum gap before the chevron">Body content.</Collapse></div>
        </div>
    }
}

class CollapsePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CollapseGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CollapseGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CollapsePage/></TestModulePage>, mainPage)
}
