import {replaceElementWithRoot, Component, RenderBasic} from "jsr:@velotype/velotype"
import type {EmptyAttrs, TargetedMouseEvent} from "jsr:@velotype/velotype"

import {Button, ButtonType, Theme} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const renderButton = function(btype: ButtonType) {
    const counter = new RenderBasic<number>(0)
    return <div>
        <Button type={btype}>{btype} button</Button>
        <Button type={btype} disabled>{btype} button (disabled)</Button>
        <Button type={btype} onClick={()=>{
            counter.value += 1
        }}>{btype} button (clicked {counter} times)</Button>
        <Button type={btype} loadingOnClick onClick={function(_event: TargetedMouseEvent<HTMLButtonElement>, resolve?: () => void) {
            if (resolve) {
                setTimeout(resolve,1000)
            }
        }}>{btype} button (with loader)</Button>
    </div>
}
class ButtonGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><Button id="default-button">default button</Button></div>
            <div style={{marginTop:"10px"}}>{renderButton("primary")}</div>
            <div style={{marginTop:"10px"}}>{renderButton("secondary")}</div>
            <div style={{marginTop:"10px"}}>{renderButton("warning")}</div>
            <div style={{marginTop:"10px"}}>{renderButton("danger")}</div>
            <div style={{marginTop:"10px"}}>{renderButton("text")}</div>
        </div>
    }
}

Theme.addStyles()

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ButtonGallery/></TestModulePage>, mainPage)
}