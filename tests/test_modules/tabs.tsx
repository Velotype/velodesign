import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { setThemeOnSelector, Tabs, TextBox, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

// A factory, not a shared constant - `content` values are real DOM nodes/components built
// once when evaluated, and this module gets rendered twice (light/dark theme galleries below).
// A single shared array would mean both Tabs instances' "team" panel pointing at the exact same
// TextBox node, which can only ever be attached in one place - the second instance to render
// would silently steal it away from the first, leaving that panel empty.
function getSampleTabs() {
    return [
        {key: "overview", label: "Overview", content: "High-level summary content goes here."},
        // A real input here, rather than plain text, so a test can prove switching tabs away and
        // back doesn't lose whatever the user typed - which it would if Tabs rebuilt panel
        // content via refresh() on every switch instead of just toggling visibility.
        {key: "team", label: "Team Members", content: <TextBox id="team-tab-input" type="text" placeholder="Type here"/>},
        {key: "billing", label: "Billing & Invoices", content: "Payment history and upcoming charges."},
        {key: "notifications", label: "Notification Settings", content: "Choose what you get notified about."},
        {key: "danger", label: "Danger Zone", content: "Irreversible and destructive actions."},
    ]
}

class TabsGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "560px", border: "1px dashed var(--background-5)", padding: "8px"}}>
            <Tabs id="default-tabs" tabs={getSampleTabs()}/>
        </div>
    }
}

class TabsPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TabsGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TabsGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TabsPage/></TestModulePage>, mainPage)
}
