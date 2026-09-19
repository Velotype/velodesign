import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, Badge, setThemeOnSelector, Sidebar, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class SidebarGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", gap:"24px", alignItems:"flex-start"}}>
            {/* The plain shape: a flat list of links */}
            <div id="default-sidebar" style={{display:"flex", border:"1px dashed var(--background-5)", height:"320px"}}>
                <Sidebar header="Sections" spa items={[
                    {label: "Overview", to: "/sidebar"},
                    {label: "Settings", to: "/sidebar/settings"},
                    {label: "Billing", to: "/sidebar/billing"}
                ]}/>
            </div>

            {/*
              * Everything optional at once: groups, icons, a trailing count, a collapsible rail, a
              * draggable edge and an account row whose menu has a submenu and a divider.
              */}
            <div id="full-sidebar" style={{display:"flex", border:"1px dashed var(--background-5)", height:"420px"}}>
                <Sidebar
                    spa
                    collapsible
                    resizable
                    ariaLabel="Workspace"
                    collapseLabel="Collapse or expand the sidebar"
                    header="Workspace"
                    defaultWidth={230}
                    items={[
                        {key: "reports", label: "Reports", icon: "▤", defaultOpen: true, trailing: <Badge type="neutral">3</Badge>, children: [
                            // Links to this very page, so the gallery always has one active entry -
                            // which is what makes the active-group marker visible here at all
                            {label: "Overview", to: "/sidebar"},
                            {label: "Daily", to: "/sidebar/daily"},
                            {label: "Weekly", to: "/sidebar/weekly"}
                        ]},
                        {key: "people", label: "People", icon: "◔", children: [
                            {label: "Members", to: "/sidebar/members"},
                            {label: "Invites", to: "/sidebar/invites"}
                        ]},
                        {key: "settings", label: "Settings", icon: "◧", to: "/sidebar/settings"}
                    ]}
                    profile={{
                        avatar: <Avatar initials="VD" size="1.9em"/>,
                        name: "Velo Designer",
                        detail: "design@velotype.dev",
                        menuAriaLabel: "Account",
                        menuItems: [
                            {label: "Profile", href: "/sidebar/profile"},
                            {label: "Appearance", children: [
                                {label: "Light", href: "/sidebar/light"},
                                {label: "Dark", href: "/sidebar/dark"}
                            ]},
                            {label: "Sign out", dividerBefore: true, href: "/sidebar/out"}
                        ]
                    }}/>
            </div>
        </div>
    }
}

class SidebarPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SidebarGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SidebarGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SidebarPage/></TestModulePage>, mainPage)
}
