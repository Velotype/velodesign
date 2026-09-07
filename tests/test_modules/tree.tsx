import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Theme, Tree } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TreeGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px", display:"flex", border:"1px dashed var(--background-5)"}}>
            <Tree id="default-tree" nodes={[
                {key: "src", label: "src", defaultOpen: true, children: [
                    {key: "components", label: "components", children: [
                        {key: "button", label: "button.tsx"},
                        {key: "card", label: "card.tsx"},
                    ]},
                    {key: "index", label: "index.ts"},
                ]},
                {key: "readme", label: "readme.md"},
            ]}/>
        </div>
    }
}

class TreePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TreeGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TreeGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TreePage/></TestModulePage>, mainPage)
}
