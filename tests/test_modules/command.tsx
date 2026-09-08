import {replaceElementWithRoot, Component, getComponent, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Command, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class CommandGallery extends Component<EmptyAttrs> {
    lastPicked = new RenderBasic<string>("none")

    override render() {
        // `<Command/>` evaluates to the rendered <dialog> element, not the Command instance -
        // and <dialog> happens to have its own native showModal() under the exact same name,
        // which would silently be called instead of Command's own (which resets the search
        // query and populates the list) if `command` here were that raw element. getComponent
        // gets the real instance so showModal() actually runs Command's own logic.
        const command = getComponent<Command>(<Command
            placeholder="Search commands..."
            items={[
                {key: "new-file", label: "New file", searchText: "new file create", onSelect: () => { this.lastPicked.value = "New file" }},
                {key: "new-folder", label: "New folder", searchText: "new folder create directory", onSelect: () => { this.lastPicked.value = "New folder" }},
                {key: "open-settings", label: "Open settings", searchText: "open settings preferences", onSelect: () => { this.lastPicked.value = "Open settings" }},
                {key: "toggle-theme", label: "Toggle dark mode", searchText: "toggle dark mode theme", onSelect: () => { this.lastPicked.value = "Toggle dark mode" }},
            ]}/>)
        return <div style={{marginTop:"10px"}}>
            {command}
            <Button id="open-command-btn" type="secondary" onClick={()=>{ command.showModal() }}>Open command palette</Button>
            <div id="last-picked-command" style={{marginTop:"10px"}}>Last picked: {this.lastPicked}</div>
        </div>
    }
}

class CommandPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CommandGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CommandGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CommandPage/></TestModulePage>, mainPage)
}
