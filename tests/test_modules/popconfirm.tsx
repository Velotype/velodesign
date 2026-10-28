import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Popconfirm, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class PopconfirmGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"40px", display:"flex", gap:"40px"}}>
            <Popconfirm id="default-popconfirm" title="Delete this item?" onConfirm={()=>{}}>
                <Button type="danger">Delete</Button>
            </Popconfirm>
            <Popconfirm id="no-outside-close-popconfirm" title="Only closes via Cancel/Confirm." onConfirm={()=>{}} closeOnOutsideClick={false}>
                <Button type="danger">Stays open</Button>
            </Popconfirm>
            {/* A Delete at the far end of a box that scrolls sideways, as in the last column of a wide table */}
            <div class="edge-scroller" style={{width: "220px", overflow: "auto", border: "1px dashed currentColor"}}>
                <div style={{width: "700px", display: "flex", justifyContent: "end"}}>
                    <Popconfirm class="edge-popconfirm" title="Delete this row? The bubble must stay in view." onConfirm={()=>{}}>
                        <Button type="danger">Delete</Button>
                    </Popconfirm>
                </div>
            </div>
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
