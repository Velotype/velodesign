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
    /** Same meaning as `Link`'s own `spa` attr (default `false`) - set `true` for an SPA so
     * clicking does a client-side route change instead of a real navigation. The
     * active-highlight itself works unchanged either way: on a multi-page site every navigation
     * is a full reload, so each page's own fresh mount already evaluates `location.pathname`
     * against the page the browser is actually now on - there's no live state to keep in sync
     * the way an SPA's `popstate`/`locationchange` listeners exist for. */
    spa?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areNavLinkStylesMounted = false

/**
 * A `<Link/>` that also knows whether it matches the current location, for highlighting
 * the active item in navigational UI (`Navbar`, `Sidebar`, etc).
 *
 * Defaults to plain navigation (see `spa` attr) - a real page load, same as a hand-written
 * anchor tag. The `popstate`/`locationchange` listeners below are still always registered
 * regardless of `spa`: they're what an SPA (`spa={true}`) needs to keep the active-highlight in
 * sync as the route changes, and harmless (just never-firing, since a real navigation destroys
 * this instance - and its listeners - before one could fire) overhead otherwise.
 */
export class NavLink extends Component<NavLinkAttrsType> {
    /** Mount this Component */
    override mount() {
        if (!areNavLinkStylesMounted) {
            areNavLinkStylesMounted = true
            setStylesheet(`
.vtd-navlink{
position:relative;
color:inherit;
text-decoration:none;
}
/*
 * See Tabs' identical comment for the full explanation: ::after carries a permanently-bold,
 * invisible copy of the link text (via attr(data-label), set only when children is a plain
 * string) so switching a link's own weight to bold on activation - which can happen live, via
 * popstate/locationchange, while this exact element stays mounted - never shifts layout.
 */
.vtd-navlink::after{
content:attr(data-label);
display:block;
height:0;
overflow:hidden;
visibility:hidden;
font-weight:bold;
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
        const spa = attrs.spa ?? false
        const soleChild = children.length == 1 ? children[0] : undefined
        const plainTextLabel = typeof soleChild == "string" || typeof soleChild == "number" || typeof soleChild == "bigint" ? String(soleChild) : undefined
        return passthroughAttrsToElement<HTMLAnchorElement>(<a
            href={attrs.to}
            class={`vtd-navlink${isActive ? ` ${activeClass}` : ""}`}
            data-label={plainTextLabel}
            aria-current={isActive ? "page" : undefined}
            onClick={spa ? (event: Event) => {
                event.preventDefault()
                History.changeLocation(attrs.to)
            } : undefined}>
            {children}
        </a>, attrs)
    }
}
