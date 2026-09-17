import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Navbar/>` Component
 */
export type NavbarAttrsType = {
    /** Brand/logo content, shown at the far left */
    brand?: RenderableElements
    /**
     * Content shown immediately after `brand`, still on the left - for navigation that belongs
     * beside the brand rather than out with the account controls (a product switcher, a search
     * trigger). `children` stay pushed to the right regardless of whether this is set.
     */
    leading?: RenderableElements
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
width:100%;
box-sizing:border-box;
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
padding:0.75em 1em;
border-block-end:1px solid var(--background-4);
}
.vtd-navbar-start{
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
/* The auto margin lives here rather than on the brand, so brand and leading group together on
   the left and children are pushed right whether or not leading is set. */
margin-inline-end:auto;
}
.vtd-navbar-brand{
font-weight:bold;
}
.vtd-navbar-leading,.vtd-navbar-items{
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
}
`, "vtd/Navbar")
    }

    return passthroughAttrsToElement<HTMLElement>(<nav class="vtd-navbar">
        <div class="vtd-navbar-start">
            {attrs.brand && <div class="vtd-navbar-brand">{attrs.brand}</div>}
            {attrs.leading && <div class="vtd-navbar-leading">{attrs.leading}</div>}
        </div>
        <div class="vtd-navbar-items">{children}</div>
    </nav>, attrs)
}
