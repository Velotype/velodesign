import {replaceElementWithRoot, Component} from "jsr:@velotype/velotype"
import type {EmptyAttrs} from "jsr:@velotype/velotype"

import { setThemeOnSelector, Theme, TimeAgo } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TimeAgoGallery extends Component<EmptyAttrs> {
    override render() {
        const now = new Date()
        const delta = (lessSeconds: number) => {
            return new Date((now.getTime() - (lessSeconds*1000))).toISOString()
        }
        return <div id="timeago-page">
            <div>{now.toISOString()}: <span id="now"><TimeAgo timestamp={now.toISOString()}/></span></div>
            <div>{delta(1)}: <span id="less-1"><TimeAgo timestamp={delta(1)}/></span></div>
            <div>{delta(10)}: <span id="less-10"><TimeAgo timestamp={delta(10)}/></span></div>
            <div>{delta(30)}: <span id="less-30"><TimeAgo timestamp={delta(30)}/></span></div>
            <div>{delta(62)}: <span id="less-62"><TimeAgo timestamp={delta(62)}/></span></div>
            <div>{delta(160)}: <span id="less-160"><TimeAgo timestamp={delta(160)}/></span></div>
            <div>{delta(4000)}: <span id="less-4000"><TimeAgo timestamp={delta(4000)}/></span></div>
            <div>{delta(40000)}: <span id="less-40000"><TimeAgo timestamp={delta(40000)}/></span></div>
            <div>{delta(100000)}: <span id="less-100000"><TimeAgo timestamp={delta(100000)}/></span></div>
            <div>{delta(400000)}: <span id="less-400000"><TimeAgo timestamp={delta(400000)}/></span></div>
            <div>{delta(4000000)}: <span id="less-4000000"><TimeAgo timestamp={delta(4000000)}/></span></div>
        </div>
    }
}

class TimeAgoPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TimeAgoGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TimeAgoGallery/></div>
        </div>
    }
}

Theme.addStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TimeAgoPage/></TestModulePage>, mainPage)
}
