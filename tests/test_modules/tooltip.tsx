import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, setThemeOnSelector, Theme, Tooltip } from "../../src/index.ts"
import type { TooltipPlacement } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const placements: TooltipPlacement[] = ["top", "bottom", "left", "right"]

class TooltipGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"40px", display: "flex", gap: "40px"}}>
            {placements.map(placement => <Tooltip content={`tooltip (${placement})`} placement={placement}><Button type="secondary">{placement}</Button></Tooltip>)}
        </div>
    }
}

class TooltipPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TooltipGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TooltipGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TooltipPage/></TestModulePage>, mainPage)
}
