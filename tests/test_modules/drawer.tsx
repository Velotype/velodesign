import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Drawer, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class DrawerGallery extends Component<EmptyAttrs> {
    override render() {
        const drawer = <Drawer title="Settings" placement="right">Drawer body content goes here.</Drawer>
        return <div style={{marginTop:"10px"}}>
            {drawer}
            <Button id="open-drawer-btn" type="secondary" onClick={()=>{ drawer.showModal() }}>Open drawer</Button>
        </div>
    }
}

class DrawerPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><DrawerGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><DrawerGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><DrawerPage/></TestModulePage>, mainPage)
}
