import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { AspectRatio, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class AspectRatioGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px"}}>
            <div id="default-aspect-ratio"><AspectRatio ratio={16/9}>
                <div style={{background: "var(--primary-3)", display:"flex", alignItems:"center", justifyContent:"center"}}>16:9</div>
            </AspectRatio></div>
        </div>
    }
}

class AspectRatioPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><AspectRatioGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><AspectRatioGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><AspectRatioPage/></TestModulePage>, mainPage)
}
