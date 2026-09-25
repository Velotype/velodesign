import {replaceElementWithRoot, Component, getComponent, RenderObject} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, Badge, setThemeOnSelector, Sidebar, TextBox, Theme } from "../../src/index.ts"
import type { SidebarNavState } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/* Shared with the button that opens it, the way Navbar's menu control does */
const searchNav = new RenderObject<SidebarNavState>({open: false, overlay: false})

/* dividerBefore on the first entry is ignored - a rule there would sit against the top of the list
   - so this gallery asserts that as well as the real one */
const defaultSidebarItems = [
    {label: "Overview", to: "/sidebar", dividerBefore: true},
    {label: "Settings", to: "/sidebar/settings"},
    {label: "Billing", to: "/sidebar/billing", dividerBefore: true},
]
class SidebarGallery extends Component<EmptyAttrs> {
    /*
     * Per gallery, not module-wide: this page renders the gallery once per theme column, and a
     * component instance is one element - sharing one would have the dark column move it out of
     * the light one. The same reason the button below is a class rather than an id.
     */
    #defaultSidebar = getComponent<Sidebar>(<Sidebar
        header="Sections"
        spa
        overlayBelow=""
        collapsible
        collapseLabel="Collapse or expand"
        items={defaultSidebarItems}/>)

    override render() {
        return <div style={{marginTop:"10px", display:"flex", gap:"24px", alignItems:"flex-start"}}>
            {/* The plain shape: a flat list of links */}
            {/*
              * `setItems` is how a consumer filters a sidebar - the showcase's search box does
              * exactly this - and it replaces the tree in place. That rebuild is what stops the
              * rows tracking navigation, so the gallery offers it as a button: a test can put the
              * sidebar into its post-rebuild state and then navigate.
              */}
            <button type="button" class="reset-sidebar-items" onClick={() => this.#defaultSidebar.setItems(defaultSidebarItems)}>Rebuild</button>
            <div id="default-sidebar" style={{display:"flex", border:"1px dashed var(--background-5)", height:"320px"}}>
                {this.#defaultSidebar}
            </div>

            {/*
              * A focusable header - a search box is the common one, and the shape that found the
              * bug: in overlay mode the header sits in a flex row beside the close control, and the
              * rule that tucks it against that control took away the room its focus ring draws in.
              */}
            <div id="search-sidebar" style={{display:"flex", border:"1px dashed var(--background-5)", height:"320px"}}>
                {/* Left on the default breakpoint, so at a narrow viewport this one is an overlay */}
                <button type="button" id="open-search-sidebar" onClick={() => searchNav.set({...searchNav.get(), open: true})}>Open</button>
                <Sidebar spa nav={searchNav} header={<TextBox type="text" clearable placeholder="Search" style={{width:"100%"}}/>} items={[
                    {label: "Overview", to: "/sidebar"},
                    {label: "Settings", to: "/sidebar/settings"}
                ]}/>
            </div>

            {/*
              * Everything optional at once: groups, icons, a trailing count, a collapsible rail, a
              * draggable edge and an account row whose menu has a submenu and a divider.
              */}
            <div id="full-sidebar" style={{display:"flex", border:"1px dashed var(--background-5)", height:"420px"}}>
                <Sidebar
                    spa
                    overlayBelow=""
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
