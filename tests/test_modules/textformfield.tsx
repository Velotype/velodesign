import {replaceElementWithRoot, Component, RenderBasic} from "jsr:@velotype/velotype"
import type {EmptyAttrs} from "jsr:@velotype/velotype"

import { setThemeOnSelector, TextEditableField, TextFormField, TextNonEditableField, Theme} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TextFormFieldGallery extends Component<EmptyAttrs> {
    formField = new RenderBasic<string>("form field starting value")
    formEditableField = new RenderBasic<string>("form editable field starting value")
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><TextNonEditableField value="Sample NonEditable value">Sample NonEditable label</TextNonEditableField></div>
            <hr/>
            <div style={{marginTop:"10px"}}>Live value of RenderBasic for formField: {this.formField}</div>
            <div style={{marginTop:"10px"}}><TextFormField field={this.formField} updateOnInput>Sample FormField label</TextFormField></div>
            <hr/>
            <div style={{marginTop:"10px"}}>Live value of RenderBasic for formEditableField: {this.formEditableField}</div>
            <div style={{marginTop:"10px"}}><TextEditableField field={this.formEditableField}>Sample EditableField label</TextEditableField></div>
        </div>
    }
}

class TextFormFieldPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TextFormFieldGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TextFormFieldGallery/></div>
        </div>
    }
}

Theme.addStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TextFormFieldPage/></TestModulePage>, mainPage)
}