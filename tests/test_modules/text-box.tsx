import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, TextBox, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TextBoxGallery extends Component<EmptyAttrs> {
    buttonClicked = new RenderBasic<boolean>(false)
    inputs = new RenderBasic<string>("(nothing yet)")
    override render() {
        return <div>
            <div>Type text: <TextBox type="text"/></div>
            <div>Type email: <TextBox type="email"/></div>
            <div>Type phone: <TextBox type="phone"/></div>
            <div>Type password: <TextBox type="password"/></div>
            <div>Type new-password: <TextBox type="new-password"/></div>
            {/*
              * clearable wraps the input, so the root is a span and the input is inside it. The
              * control only appears once there is something to clear, and clearing fires the same
              * events typing does.
              */}
            <div id="clearable-box">Filter: <TextBox
                type="text"
                clearable
                clearLabel="Clear the filter"
                placeholder="Search..."
                onInput={(event) => {
                    if (event.target instanceof HTMLInputElement) {
                        this.inputs.value = event.target.value || "(empty)"
                    }
                }}/></div>
            <div id="clearable-last-input">last input: {this.inputs}</div>
        </div>
    }
}

class TextBoxPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TextBoxGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TextBoxGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TextBoxPage/></TestModulePage>, mainPage)
}
