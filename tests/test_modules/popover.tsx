import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Popover, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const heard = {opened: 0, closed: 0}
const driven = getComponent<Popover>(<Popover id="driven-popover" trigger={<Button type="secondary">Driven</Button>} content={<input id="driven-input"/>}
    onOpen={() => {heard.opened++; (document.getElementById("driven-input") as HTMLElement).focus()}}
    onClose={() => {heard.closed++}}/>)
const globals = globalThis as unknown as Record<string, unknown>
globals.driven = driven
globals.heard = heard

class PopoverGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"40px", display:"flex", gap:"40px"}}>
            <Popover id="default-popover" trigger={<Button type="secondary">Click me</Button>} content="Rich popover content, shown on click."/>
            <Popover trigger={<Button type="secondary">Right side</Button>} placement="right" content="A popover to the right."/>
            <Popover id="no-outside-close-popover" trigger={<Button type="secondary">Stays open</Button>} content="Only closes via its own trigger - closeOnOutsideClick={false}." closeOnOutsideClick={false}/>
        </div>
    }
}

/** Each alone in a row, so where its trigger sits is the test's to say */
class AlignGallery extends Component<EmptyAttrs> {
    override render() {
        const content = <div style={{width: "16em"}}>Wider than the trigger</div>
        return <div style={{marginTop: "20px"}}>
            <div>{driven}</div>
            <div id="align-end-row" style={{display: "flex", justifyContent: "center"}}><Popover id="align-end-popover" align="end" trigger={<Button type="secondary">End</Button>} content={content}/></div>
            <div id="align-auto-right" style={{display: "flex", justifyContent: "flex-end"}}><Popover id="auto-right-popover" align="auto" trigger={<Button type="secondary">Auto</Button>} content={<div style={{width: "16em"}}>Right</div>}/></div>
            <div id="align-auto-left"><Popover id="auto-left-popover" align="auto" trigger={<Button type="secondary">Auto</Button>} content={<div style={{width: "16em"}}>Left</div>}/></div>
            <div id="holder-row" style={{display: "flex", justifyContent: "flex-end"}}><Popover id="holder-popover" trigger={<Button type="secondary">Held</Button>} content={<div style={{width: "16em"}}>Slid in from the edge</div>}/></div>
            <div id="scrolling-row" style={{position: "fixed", top: "60px", left: "0"}}><Popover id="scrolling-popover" scrolls trigger={<Button type="secondary">Tall</Button>} content={<div style={{height: "900px"}}>Tall</div>}/></div>
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
    replaceElementWithRoot(<TestModulePage><PopoverPage/><AlignGallery/></TestModulePage>, mainPage)
}
