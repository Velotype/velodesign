import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Progress, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ProgressGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px", display:"flex", flexDirection:"column", gap:"14px"}}>
            <div id="default-progress"><Progress value={40}/></div>
            <div><Progress value={70} showLabel/></div>
            <div><Progress value={100} type="secondary" showLabel/></div>
            <div><Progress value={55} type="warning" showLabel/></div>
            <div><Progress value={20} type="danger" showLabel/></div>
            <div id="working-progress">{this.#task}</div>
            <div><Progress value={10} max={10} working status="Sent 10"/></div>
            <div><Button type="secondary" id="working-progress-run" onClick={() => this.#run()}>Run</Button></div>
        </div>
    }

    /** A task that counts up to its end, so the finish can be watched */
    #task = getComponent<Progress>(<Progress value={0} max={200} working status="0 of 200"/>)
    #timer: number | undefined
    #run() {
        clearTimeout(this.#timer)
        let n = 0
        this.#task.setValue(0, "0 of 200")
        const step = () => {
            n = Math.min(200, n + 4 + Math.floor(Math.random() * 14))
            this.#task.setValue(n, n < 200 ? `${n} of 200` : "Sent 200")
            if (n < 200) {this.#timer = setTimeout(step, 350 + Math.random() * 650)}
        }
        this.#timer = setTimeout(step, 300)
    }
}

class ProgressPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ProgressGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ProgressGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ProgressPage/></TestModulePage>, mainPage)
}
