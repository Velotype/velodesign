import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Card, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class CardGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div style={{marginTop:"10px", maxWidth: "320px"}}><Card>simple card, no header or footer</Card></div>
            <div style={{marginTop:"10px", maxWidth: "320px"}}>
                <Card header="Card title" footer={<Button type="primary">Action</Button>}>
                    Card body content goes here.
                </Card>
            </div>
            <div id="card-multi-footer" style={{marginTop:"10px", maxWidth: "320px"}}>
                <Card header="Card title" footer={<span style={{display:"contents"}}>
                    <Button type="secondary">Cancel</Button>
                    <Button type="primary">Confirm</Button>
                </span>}>
                    Footer actions default to flush right.
                </Card>
            </div>
        </div>
    }
}

class CardPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CardGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CardGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CardPage/></TestModulePage>, mainPage)
}
