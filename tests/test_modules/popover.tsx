import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Popover, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class PopoverGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"40px", display:"flex", gap:"40px"}}>
            <Popover id="default-popover" trigger={<Button type="secondary">Click me</Button>} content="Rich popover content, shown on click."/>
            <Popover trigger={<Button type="secondary">Right side</Button>} placement="right" content="A popover to the right."/>
        </div>
    }
}

class PopoverPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><PopoverGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><PopoverGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><PopoverPage/></TestModulePage>, mainPage)
}
