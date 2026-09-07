import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { ContextMenu, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ContextMenuGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <div id="default-context-menu"><ContextMenu items={[
                {label: "Copy", onClick: ()=>{}},
                {label: "Paste", onClick: ()=>{}},
                {label: "Delete", disabled: true},
            ]}>
                <div style={{padding: "2em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem"}}>Right-click here</div>
            </ContextMenu></div>
        </div>
    }
}

class ContextMenuPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ContextMenuGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ContextMenuGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ContextMenuPage/></TestModulePage>, mainPage)
}
