import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { NavLink, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class NavLinkGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display: "flex", gap: "12px"}}>
            <NavLink id="navlink-home" to="/navlink" spa>Home (exact, active here)</NavLink>
            <NavLink to="/navlink/other" spa>Other (inactive)</NavLink>
            <NavLink to="/navlink" exact={false} spa>Home (prefix match)</NavLink>
        </div>
    }
}

class NavLinkPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><NavLinkGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><NavLinkGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><NavLinkPage/></TestModulePage>, mainPage)
}
