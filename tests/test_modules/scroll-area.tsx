import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { ScrollArea, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ScrollAreaGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px"}}>
            <div id="default-scroll-area"><ScrollArea maxHeight="8em" style={{border: "1px solid var(--background-4)", borderRadius: "0.25rem", padding: "8px"}}>
                {Array.from({length: 20}).map((_, i) => <div style={{padding: "4px 0"}}>Row {i + 1}</div>)}
            </ScrollArea></div>
        </div>
    }
}

class ScrollAreaPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ScrollAreaGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ScrollAreaGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ScrollAreaPage/></TestModulePage>, mainPage)
}
