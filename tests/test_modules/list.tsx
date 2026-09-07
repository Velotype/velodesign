import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, Badge, List, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ListGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px"}}>
            <div id="default-list"><List items={[
                {key: "1", leading: <Avatar initials="JW"/>, title: "Jonathan Word", description: "jonathan@example.com", trailing: <Badge type="secondary">online</Badge>},
                {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com"},
                {key: "3", leading: <Avatar initials="CD"/>, title: "Casey Diaz", description: "casey@example.com"},
            ]}/></div>
        </div>
    }
}

class ListPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ListGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ListGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ListPage/></TestModulePage>, mainPage)
}
