import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { NavLink } from "./navlink.tsx"

/**
 * A single entry in a `<Sidebar/>`
 */
export type SidebarItemType = {
    /** Displayed label for this entry */
    label: RenderableElements
    /** URL this entry links to */
    to: string
}

/**
 * Attrs type for `<Sidebar/>` Component
 */
export type SidebarAttrsType = {
    /** The set of entries to list */
    items: SidebarItemType[]
    /** Optional content shown above the list (e.g. a section title) */
    header?: RenderableElements
    /** Accessible label for the navigation landmark. No default - the library doesn't assume a language; set this (e.g. to "Sidebar") to give screen reader users a description */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs

let areSidebarStylesMounted = false

/**
 * A themed vertical navigation list, with the current page highlighted automatically
 */
export const Sidebar: FunctionComponent<SidebarAttrsType> = function(attrs: SidebarAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areSidebarStylesMounted) {
        areSidebarStylesMounted = true
        setStylesheet(`
.vtd-sidebar{
width:100%;
min-width:12em;
box-sizing:border-box;
}
.vtd-sidebar-header{
font-weight:bold;
padding:0.5em 0.75em;
}
.vtd-sidebar-list{
list-style:none;
padding:0;
margin:0;
}
.vtd-sidebar-link{
display:block;
padding:0.5em 0.75em;
border-radius:0.25rem;
}
.vtd-sidebar-link:hover{background-color:var(--background-1);}
.vtd-sidebar-link.vtd-navlink-active{background-color:var(--primary-2);}
`, "vtd/Sidebar")
    }

    return passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-sidebar">
        {attrs.header && <div class="vtd-sidebar-header">{attrs.header}</div>}
        <ul class="vtd-sidebar-list">
            {attrs.items.map(item => <li><NavLink to={item.to} class="vtd-sidebar-link">{item.label}</NavLink></li>)}
        </ul>
    </nav>, attrs)
}
