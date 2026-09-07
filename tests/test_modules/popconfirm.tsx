import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Popconfirm, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class PopconfirmGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"40px"}}>
            <Popconfirm id="default-popconfirm" title="Delete this item?" onConfirm={()=>{}}>
                <Button type="danger">Delete</Button>
            </Popconfirm>
        </div>
    }
}

class PopconfirmPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><PopconfirmGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><PopconfirmGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><PopconfirmPage/></TestModulePage>, mainPage)
}
