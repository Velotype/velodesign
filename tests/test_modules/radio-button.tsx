import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { RadioButton, Theme} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class ButtonGallery extends Component<EmptyAttrs> {
    override render() {
        const btnName = "btn"
        return <div>
            <div style={{marginTop:"10px"}}>
                <RadioButton name={btnName}>{btnName} radio button</RadioButton>
                <RadioButton name={btnName} disabled>{btnName} button (disabled)</RadioButton>
                <RadioButton name={btnName} checked>{btnName} button (checked)</RadioButton>
            </div>
        </div>
    }
}

Theme.injectStyles()

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ButtonGallery/></TestModulePage>, mainPage)
}