import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Resizable, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ResizableGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <div id="default-resizable"><Resizable initialSize="14em" minSize={120} maxSize={400} style={{border: "1px solid var(--background-4)", borderRadius: "0.25rem"}}>
                <div style={{padding: "1em"}}>Drag the right edge to resize.</div>
            </Resizable></div>
        </div>
    }
}

class ResizablePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ResizableGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ResizableGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ResizablePage/></TestModulePage>, mainPage)
}
