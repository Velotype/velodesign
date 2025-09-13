import {replaceElementWithRoot, Component, RenderBasic} from "jsr:@velotype/velotype"
import type {EmptyAttrs} from "jsr:@velotype/velotype"

import { TextEditableField, TextFormField, TextNonEditableField, Theme} from "../../src/index.ts"
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

Theme.addStyles()

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TextFormFieldGallery/></TestModulePage>, mainPage)
}