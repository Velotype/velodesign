import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Form, FormField, setThemeOnSelector, TextBox, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class FormGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px"}}>
            <div id="default-form"><Form onSubmit={()=>{}}>
                <FormField label="Name" required>
                    <TextBox type="text" name="name" required/>
                </FormField>
                <FormField label="Email" error="Enter a valid email address">
                    <TextBox type="email" name="email"/>
                </FormField>
                <Button type="primary">Submit</Button>
            </Form></div>
        </div>
    }
}

class FormPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><FormGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><FormGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><FormPage/></TestModulePage>, mainPage)
}
