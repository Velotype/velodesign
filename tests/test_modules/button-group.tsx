import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, ButtonGroup, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ButtonGroupGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"20px"}}>
            <div id="default-button-group"><ButtonGroup>
                <Button type="secondary">Left</Button>
                <Button type="secondary">Middle</Button>
                <Button type="secondary">Right</Button>
            </ButtonGroup></div>
            <div><ButtonGroup>
                <Button type="primary">Save</Button>
                <Button type="danger">Delete</Button>
            </ButtonGroup></div>
            <div><ButtonGroup orientation="vertical">
                <Button type="secondary">Top</Button>
                <Button type="secondary">Middle</Button>
                <Button type="secondary" disabled>Bottom</Button>
            </ButtonGroup></div>
        </div>
    }
}

class ButtonGroupPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ButtonGroupGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ButtonGroupGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ButtonGroupPage/></TestModulePage>, mainPage)
}
