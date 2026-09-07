import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Link } from "./link.tsx"

/**
 * A single crumb in a `<Breadcrumbs/>` trail
 */
export type BreadcrumbItemType = {
    /** Displayed label for this crumb */
    label: RenderableElements
    /** URL for this crumb; omit for the current page (rendered as plain text, not a link) */
    to?: string
}

/**
 * Attrs type for `<Breadcrumbs/>` Component
 */
export type BreadcrumbsAttrsType = {
    /** The trail of crumbs, in order from root to current page */
    items: BreadcrumbItemType[]
    /** Content shown between crumbs (default: `"/"`) */
    separator?: RenderableElements
    /** Accessible label for the navigation landmark. No default - the library doesn't assume a language; set this (e.g. to "Breadcrumb") to give screen reader users a description */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs

let areBreadcrumbsStylesMounted = false

/**
 * A navigational trail showing where the current page sits in the site hierarchy
 */
export const Breadcrumbs: FunctionComponent<BreadcrumbsAttrsType> = function(attrs: BreadcrumbsAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areBreadcrumbsStylesMounted) {
        areBreadcrumbsStylesMounted = true
        setStylesheet(`
.vtd-breadcrumbs-list{
display:flex;
flex-wrap:wrap;
align-items:center;
list-style:none;
padding:0;
margin:0;
}
.vtd-breadcrumbs-item{
display:flex;
align-items:center;
}
.vtd-breadcrumbs-item a{color:inherit;}
.vtd-breadcrumbs-item[aria-current="page"]{font-weight:bold;}
.vtd-breadcrumbs-separator{
margin-inline:0.5em;
color:var(--background-6);
}
`, "vtd/Breadcrumbs")
    }

    return passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-breadcrumbs">
        <ol class="vtd-breadcrumbs-list">
            {attrs.items.map((item, index) => <li class="vtd-breadcrumbs-item" aria-current={item.to ? undefined : "page"}>
                {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                {index < attrs.items.length - 1 ? <span class="vtd-breadcrumbs-separator" aria-hidden="true">{attrs.separator || "/"}</span> : null}
            </li>)}
        </ol>
    </nav>, attrs)
}
