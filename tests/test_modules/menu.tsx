import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Menu, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class MenuGallery extends Component<EmptyAttrs> {
    clicks = new RenderBasic<number>(0)
    override render() {
        return <div style={{marginTop:"40px", display: "flex", gap: "24px"}}>
            <Menu id="actions-menu" trigger="Actions" items={[
                {label: "Do a thing", onClick: () => {this.clicks.value += 1}},
                {label: "Disabled thing", disabled: true},
                {label: "Do another thing", onClick: () => {this.clicks.value += 1}}
            ]}/>
            <div id="menu-click-count">clicked {this.clicks} times</div>
            <Menu trigger="Products" items={[
                {label: "Widgets", href: "/menu/widgets"},
                {label: "Gadgets", href: "/menu/gadgets"}
            ]}/>
            <Menu id="stays-open-menu" trigger="Stays open" closeOnOutsideClick={false} items={[
                {label: "Widgets", href: "/menu/widgets"},
                {label: "Gadgets", href: "/menu/gadgets"}
            ]}/>
            {/* Submenus nest to any depth, and dividers group what follows them */}
            <Menu id="nested-menu" trigger="Account" items={[
                {label: "Profile", onClick: () => {this.clicks.value += 1}},
                {label: "Workspace", children: [
                    {label: "Invite someone", onClick: () => {this.clicks.value += 1}},
                    {label: "Members", href: "/menu/members"},
                    {label: "Billing", href: "/menu/billing"},
                    // keepOpen: a setting the reader may want to try both ways, so the pair of
                    // controls has to still be there after the first click
                    {label: "Compact rows", keepOpen: true, onClick: () => {this.clicks.value += 1}},
                    {label: "Regions", children: [
                        {label: "Europe", href: "/menu/eu"},
                        {label: "Americas", href: "/menu/us"}
                    ]}
                ]},
                // A checkable group: Menu moves the tick itself, scoped to this one list
                {label: "Density", children: [
                    {label: "Comfortable", keepOpen: true, selected: true, onClick: () => {this.clicks.value += 1}},
                    {label: "Compact", keepOpen: true, selected: false, onClick: () => {this.clicks.value += 1}},
                ]},
                {label: "Preferences", onClick: () => {this.clicks.value += 1}},
                {label: "Sign out", dividerBefore: true, onClick: () => {this.clicks.value += 1}}
            ]}/>
        </div>
    }
}

class MenuPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><MenuGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><MenuGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><MenuPage/></TestModulePage>, mainPage)
}
