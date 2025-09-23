import {replaceElementWithRoot, Component} from "jsr:@velotype/velotype"
import type {EmptyAttrs} from "jsr:@velotype/velotype"

import { Button, RadioButton, Theme} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"
import { setThemeOnSelector } from "../../src/theme.ts"

class ShowcaseSide extends Component<EmptyAttrs> {
    override render() {
        const backgroundColorGradient = (cssColorPrefix: string) => {
            const gradient = [1,2,3,4,5,6,7,8,9]
            return <div style={{marginTop:"12px"}}>
                <h4>{cssColorPrefix}</h4>
                <div style={{margin: "4pm", display: "inline-block", padding: "12px", backgroundColor: `var(--${cssColorPrefix})`}}>default</div>
                {gradient.map((index)=><div style={{margin: "4pm", display: "inline-block", padding: "12px", backgroundColor: `var(--${cssColorPrefix}-${index})`}}>{index}</div>)}
                <div style={{margin: "4pm", display: "inline-block", padding: "12px", backgroundColor: `var(--${cssColorPrefix}-alt)`}}>alternate</div>
            </div>
        }
        const textColorGradient = <div style={{marginTop:"12px"}}>
            <h4>Text</h4>
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text)', backgroundColor: 'var(--background'}}>default</div>
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text-alt)', backgroundColor: 'var(--background-alt'}}>alternate</div>
        </div>
        const textAltMap = [false,false,false,false,false,true,true,true,true]
        const textAndBackground = <div style={{marginTop:"12px"}}>
            <h4>Text + background</h4>
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text)', backgroundColor: 'var(--background'}}>default</div>
            {textAltMap.map((useAlt, index)=><div style={{margin: "4pm", display: "inline-block", padding: "12px", color: `var(--text${useAlt&&"-alt"})`, backgroundColor: `var(--background-${index+1})`}}>{index+1}</div>)}
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text-alt)', backgroundColor: 'var(--background-alt'}}>alternate</div>
        </div>
        const middleColorSpread = (cssColorPrefix: string) => {
            const gradient = [1,2,3,4,5,6,7]
            return <div style={{marginTop:"12px"}}>
                <h4>{cssColorPrefix}</h4>
                {gradient.map((index)=><div style={{margin: "4pm", display: "inline-block", padding: "12px", backgroundColor: `var(--${cssColorPrefix}-${index})`}}>{index}</div>)}
            </div>
        }
        return <div>
            This is a showcase of many Components:
            <hr/>
            Example Button:
            <div style={{marginTop:"10px"}}><Button type="primary">Example button</Button></div>
            <hr style={{marginTop:"10px"}}/>
            Example RadioButton:
            <div style={{marginTop:"10px"}}><RadioButton name="example-radio" checked>one</RadioButton></div>
            <div><RadioButton name="example-radio" checked={false}>two</RadioButton></div>
            <div><RadioButton name="example-radio" checked={false}>three</RadioButton></div>
            <hr style={{marginTop:"10px"}}/>
            {textColorGradient}
            {backgroundColorGradient("background")}
            {textAndBackground}
            {middleColorSpread("primary")}
            {middleColorSpread("secondary")}
            {middleColorSpread("warning")}
            {middleColorSpread("accent")}
            <hr style={{marginTop:"10px"}}/>
        </div>
    }
}

class ShowcasePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ShowcaseSide/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ShowcaseSide/></div>
        </div>
    }
}

Theme.addStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ShowcasePage/></TestModulePage>, mainPage)
}
