import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Glyphs, I, Icon, setThemeOnSelector, Theme } from "../../src/index.ts"
import { registerExampleIcons } from "./example-icons.ts"
import { TestModulePage } from "./module-page.tsx"


registerExampleIcons()

// A magnifier whose glint is thinner than its lens: one Icon, two line widths
const layeredIcon = new Icon(24, 24, "M16.7 10.5a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 1 1 12.4 0zM15.2 15.2l4.3 4.3", 2, false, [{d: "M7.6 9.4a3.2 3.2 0 0 1 1.9-1.9", strokeWidth: 1.2}])

class IconGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div>Example icon: <I i="settings"/></div>
            <div>Example icon with absolute color: <I i="settings" style={{color: "red"}}/></div>
            <div>Example icon with theme variable color: <I i="settings" style={{color: "var(--primary)"}}/></div>
            <div>Example big icon: <I i="settings" style={{height: "2em"}}/></div>
            <div>Example small icon: <I i="settings" style={{height: "0.75em"}}/></div>
            <div id="glyphs" style={{display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "12px", fontSize: "28px"}}>
                {Object.entries(Glyphs).map(([name, icon]) => <span title={name} data-glyph={name}><I icon={icon}/></span>)}
            </div>
            <div>A glyph with a name: <I icon={Glyphs.tick} label="Done" id="labelled-glyph"/></div>
            <div>An icon in layers, a lens with a thinner glint: <I icon={layeredIcon} id="layered-icon" style={{height: "3em"}}/></div>
        </div>
    }
}

class IconPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><IconGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><IconGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><IconPage/></TestModulePage>, mainPage)
}
