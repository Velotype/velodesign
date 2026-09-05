import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Badge, setThemeOnSelector, Theme } from "../../src/index.ts"
import type { BadgeType } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const badgeTypes: BadgeType[] = ["primary", "secondary", "warning", "danger", "neutral"]

class BadgeGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            {badgeTypes.map(type => <span style={{marginInlineEnd: "8px"}}><Badge type={type}>{type}</Badge></span>)}
        </div>
    }
}

class BadgePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><BadgeGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><BadgeGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><BadgePage/></TestModulePage>, mainPage)
}
