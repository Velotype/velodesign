import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Tag, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TagGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"14px"}}>
            <div id="default-tag" style={{display:"flex", gap:"8px"}}>
                <Tag type="primary">primary</Tag>
                <Tag type="secondary">secondary</Tag>
                <Tag type="warning">warning</Tag>
                <Tag type="danger">danger</Tag>
                <Tag type="neutral">neutral</Tag>
            </div>
            <div id="removable-tag"><Tag type="primary" onRemove={()=>{}}>removable</Tag></div>
        </div>
    }
}

class TagPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TagGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TagGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TagPage/></TestModulePage>, mainPage)
}
