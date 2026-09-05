import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Navbar/>` Component
 */
export type NavbarAttrsType = {
    /** Brand/logo content, shown on the left */
    brand?: RenderableElements
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areNavbarStylesMounted = false

/**
 * A themed top navigation bar. Typically holds a `brand` slot plus `NavLink`s as children.
 *
 * Does not attempt a responsive collapsed/hamburger layout - narrow viewports just wrap.
 */
export const Navbar: FunctionComponent<NavbarAttrsType> = function(attrs: NavbarAttrsType, children: RenderableElements[]): HTMLElement {
    if (!areNavbarStylesMounted) {
        areNavbarStylesMounted = true
        setStylesheet(`
.vtd-navbar{
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
padding:0.75em 1em;
border-block-end:1px solid var(--background-4);
}
.vtd-navbar-brand{
font-weight:bold;
margin-inline-end:auto;
}
.vtd-navbar-items{
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
}
`, "vtd/Navbar")
    }

    return passthroughAttrsToElement<HTMLElement>(<nav class="vtd-navbar">
        {attrs.brand && <div class="vtd-navbar-brand">{attrs.brand}</div>}
        <div class="vtd-navbar-items">{children}</div>
    </nav>, attrs)
}
