import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, setThemeOnSelector, Theme, Tooltip } from "../../src/index.ts"
import type { TooltipPlacement } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const placements: TooltipPlacement[] = ["top", "bottom", "left", "right", "bottom-start", "bottom-end"]

const LONG = "A long explanation that would run off the edge if it were centred on its trigger"

class TooltipGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            {/* At the very left, and at the top of a box that clips: each bubble keeps itself in view */}
            <div class="edge-cases" style={{display: "flex", gap: "40px", alignItems: "flex-start"}}>
                <Tooltip content={LONG} class="edge-left"><Button type="secondary">edge</Button></Tooltip>
                <div class="clip-box" style={{overflow: "hidden", width: "220px", height: "120px", padding: "4px", border: "1px dashed var(--background-5)"}}>
                    <Tooltip whenDisabled content={LONG} class="clip-left"><Button type="secondary" disabled>clipped</Button></Tooltip>
                </div>
            </div>
            <div style={{marginTop:"40px", display: "flex", gap: "40px"}}>
            {placements.map(placement => <Tooltip content={`tooltip (${placement})`} placement={placement}><Button type="secondary">{placement}</Button></Tooltip>)}
            <Tooltip whenDisabled content="Shown only while the button is disabled" class="disabled-why"><Button type="primary" disabled>disabled</Button></Tooltip>
            <Tooltip whenDisabled content="Never shown - the button is enabled" class="enabled-why"><Button type="primary">enabled</Button></Tooltip>
            </div>
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
