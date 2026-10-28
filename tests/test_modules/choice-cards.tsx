import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { ChoiceCards, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/** Each gallery's groups take their own names, so the light and dark copies don't share one radio group */
class ChoiceCardsGallery extends Component<{prefix: string}> {
    picked = new RenderBasic<string>("list")
    override render() {
        const p = this.attrs.prefix
        return <div>
            <div style={{marginTop: "10px"}}>
                <ChoiceCards id={`${p}-choice`} name={`${p}-who`} label="Who can reply?" value="list"
                    onChange={value => { this.picked.value = value }}
                    options={[
                        {value: "list", title: "Only my guests", description: "Each gets their own link by email."},
                        {value: "anyone", title: "Anyone with the link", description: "Share it anywhere - a group chat, a QR code."},
                    ]}/>
                <p>picked: <span class={`${p}-picked`}>{this.picked}</span></p>
            </div>
            <div style={{marginTop: "10px"}}>
                <ChoiceCards id={`${p}-disabled`} name={`${p}-cycle`} value="monthly" options={[
                    {value: "monthly", title: "Monthly", description: "Billed each month."},
                    {value: "yearly", title: "Yearly", description: "Seven months' price for twelve.", disabled: true, disabledHint: "Ask your workspace's owner"},
                ]}/>
            </div>
            <div style={{marginTop: "10px"}}>
                <ChoiceCards name={`${p}-size`} label="Three, titles only" minCardWidth="6em" options={[
                    {value: "s", title: "Small"}, {value: "m", title: "Medium"}, {value: "l", title: "Large"},
                ]}/>
            </div>
        </div>
    }
}

class ChoiceCardsPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding: "8px", flexGrow: 1, minHeight: "100vh"}}><ChoiceCardsGallery prefix="light"/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding: "8px", flexGrow: 1}}><ChoiceCardsGallery prefix="dark"/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ChoiceCardsPage/></TestModulePage>, mainPage)
}
