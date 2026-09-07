import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Rate, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class RateGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"14px"}}>
            <div id="default-rate"><Rate value={3}/></div>
            <div><Rate value={2} count={10}/></div>
            <div style={{display:"flex", gap:"14px"}}>
                <Rate value={4} type="primary"/>
                <Rate value={4} type="secondary"/>
                <Rate value={4} type="warning"/>
                <Rate value={4} type="danger"/>
            </div>
            <div><Rate value={4} disabled/></div>
        </div>
    }
}

class RatePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><RateGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><RateGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><RatePage/></TestModulePage>, mainPage)
}
