import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { History } from "./history.ts"

/**
 * Attrs type for `<NavLink/>` Component
 */
export type NavLinkAttrsType = {
    to: string
    /** CSS class added when this link matches the current location (default: `"vtd-navlink-active"`) */
    activeClass?: string
    /** If `true` (default), only matches an exact `location.pathname`; if `false`, matches any path starting with `to` */
    exact?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areNavLinkStylesMounted = false

/**
 * A `<Link/>` that also knows whether it matches the current location, for highlighting
 * the active item in navigational UI (`Navbar`, `Sidebar`, etc)
 */
export class NavLink extends Component<NavLinkAttrsType> {
    /** Mount this Component */
    override mount() {
        if (!areNavLinkStylesMounted) {
            areNavLinkStylesMounted = true
            setStylesheet(`
.vtd-navlink{
color:inherit;
text-decoration:none;
}
.vtd-navlink-active{
color:var(--primary);
font-weight:bold;
}
`, "vtd/NavLink")
        }
        globalThis.addEventListener('popstate', this.refresh)
        globalThis.addEventListener('locationchange', this.refresh)
    }

    /** Unmount this Component */
    override unmount() {
        globalThis.removeEventListener('popstate', this.refresh)
        globalThis.removeEventListener('locationchange', this.refresh)
    }

    /** Render this Component */
    override render(attrs: NavLinkAttrsType, children: RenderableElements[]): HTMLAnchorElement {
        const exact = attrs.exact === undefined ? true : attrs.exact
        const isActive = exact ? globalThis.location.pathname == attrs.to : globalThis.location.pathname.startsWith(attrs.to)
        const activeClass = attrs.activeClass || "vtd-navlink-active"
        return passthroughAttrsToElement<HTMLAnchorElement>(<a
            href={attrs.to}
            class={`vtd-navlink${isActive ? ` ${activeClass}` : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={(event: Event) => {
                event.preventDefault()
                History.changeLocation(attrs.to)
            }}>
            {children}
        </a>, attrs)
    }
}
