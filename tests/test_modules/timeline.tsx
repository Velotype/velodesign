import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Theme, Timeline } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TimelineGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px"}}>
            <div id="default-timeline"><Timeline items={[
                {key: "1", title: "Order placed", description: "2026-01-04", type: "secondary"},
                {key: "2", title: "Shipped", description: "2026-01-05", type: "primary"},
                {key: "3", title: "Delivery delayed", description: "2026-01-07", type: "warning"},
                {key: "4", title: "Delivered", description: "2026-01-08"},
            ]}/></div>
        </div>
    }
}

class TimelinePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TimelineGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TimelineGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TimelinePage/></TestModulePage>, mainPage)
}
