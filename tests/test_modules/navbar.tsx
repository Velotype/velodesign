import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { NavLink, Navbar, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class NavbarGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <Navbar brand="My App">
                <NavLink to="/navbar" spa>Home</NavLink>
                <NavLink to="/navbar/docs" spa>Docs</NavLink>
                <NavLink to="/navbar/about" spa>About</NavLink>
            </Navbar>
        </div>
    }
}

class NavbarPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{flexGrow: 1,minHeight: "100vh"}}><NavbarGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{flexGrow: 1}}><NavbarGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><NavbarPage/></TestModulePage>, mainPage)
}
