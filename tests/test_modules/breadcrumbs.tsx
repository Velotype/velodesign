import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, Badge, Breadcrumbs, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class BreadcrumbsGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <Breadcrumbs id="default-breadcrumbs" spa items={[
                {label: "Home", to: "/breadcrumbs"},
                {label: "Section", to: "/breadcrumbs#section"},
                {label: "Current page"}
            ]}/>
            <div style={{marginTop:"10px"}}>
                <Breadcrumbs spa items={[{label: "Home", to: "/breadcrumbs"}, {label: "Current"}]} separator=">"/>
            </div>

            <h3>With leading content</h3>
            <div id="leading-breadcrumbs"><Breadcrumbs spa items={[
                {label: "Home", to: "/breadcrumbs"},
                {label: "Acme", to: "/breadcrumbs#acme", leading: <Avatar initials="AC" size="1.3em"/>},
                {label: "Widgets", to: "/breadcrumbs#widgets", leading: <Badge type="primary">12</Badge>},
                {label: "Current page"}
            ]}/></div>

            <h3>Collapsed - seven crumbs, maxItems 4</h3>
            {/* One crumb and the expander take two of the four slots, so the last two survive */}
            <div id="collapsed-breadcrumbs"><Breadcrumbs spa maxItems={4} expandLabel="Show the rest of the trail" items={[
                {label: "Home", to: "/breadcrumbs"},
                {label: "Level two", to: "/breadcrumbs#two"},
                {label: "Level three", to: "/breadcrumbs#three"},
                {label: "Level four", to: "/breadcrumbs#four"},
                {label: "Level five", to: "/breadcrumbs#five"},
                {label: "Level six", to: "/breadcrumbs#six"},
                {label: "Current page"}
            ]}/></div>

            <h3>maxItems set, but the trail is short enough to fit</h3>
            <div id="uncollapsed-breadcrumbs"><Breadcrumbs spa maxItems={4} items={[
                {label: "Home", to: "/breadcrumbs"},
                {label: "Section", to: "/breadcrumbs#section"},
                {label: "Current page"}
            ]}/></div>
        </div>
    }
}

class BreadcrumbsPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><BreadcrumbsGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><BreadcrumbsGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><BreadcrumbsPage/></TestModulePage>, mainPage)
}
