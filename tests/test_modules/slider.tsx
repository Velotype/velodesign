import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Slider, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class SliderGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "260px", display:"flex", flexDirection:"column", gap:"16px"}}>
            <div id="default-slider"><Slider value={40}/></div>
            <div><Slider value={2} min={0} max={5} step={1}/></div>
            <div><Slider value={60} disabled/></div>
        </div>
    }
}

class SliderPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SliderGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SliderGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SliderPage/></TestModulePage>, mainPage)
}
