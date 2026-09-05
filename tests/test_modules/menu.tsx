import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Menu, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class MenuGallery extends Component<EmptyAttrs> {
    clicks = new RenderBasic<number>(0)
    override render() {
        return <div style={{marginTop:"40px", display: "flex", gap: "24px"}}>
            <Menu id="actions-menu" trigger="Actions" items={[
                {label: "Do a thing", onClick: () => {this.clicks.value += 1}},
                {label: "Disabled thing", disabled: true},
                {label: "Do another thing", onClick: () => {this.clicks.value += 1}}
            ]}/>
            <div id="menu-click-count">clicked {this.clicks} times</div>
            <Menu trigger="Products" items={[
                {label: "Widgets", href: "/menu/widgets"},
                {label: "Gadgets", href: "/menu/gadgets"}
            ]}/>
        </div>
    }
}

class MenuPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><MenuGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><MenuGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><MenuPage/></TestModulePage>, mainPage)
}
