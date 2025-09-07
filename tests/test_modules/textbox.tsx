import {replaceElementWithRoot, Component, RenderBasic} from "jsr:@velotype/velotype"
import type {EmptyAttrs} from "jsr:@velotype/velotype"

import { TextBox, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TextBoxGallery extends Component<EmptyAttrs> {
    buttonClicked = new RenderBasic<boolean>(false)
    override render() {
        return <div>
            <div>Type text: <TextBox type="text"/></div>
            <div>Type email: <TextBox type="email"/></div>
            <div>Type phone: <TextBox type="phone"/></div>
            <div>Type password: <TextBox type="password"/></div>
            <div>Type new-password: <TextBox type="new-password"/></div>
        </div>
    }
}

Theme.addStyles()

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TextBoxGallery/></TestModulePage>, mainPage)
}
