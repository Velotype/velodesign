import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { Link } from "./link.tsx"
import { Menu } from "./menu.tsx"
import type { MenuItemType } from "./menu.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Breadcrumbs/>` Component Theme
 */
export const BreadcrumbsThemeOptions: {
    /** Content of the expander that reveals the crumbs hidden by `maxItems`. Defaults to `CommonThemeOptions.collapseSymbol` */
    collapseSymbol: ThemeSymbol
} = themeOptions({collapseSymbol: "collapseSymbol"})

/**
 * A single crumb in a `<Breadcrumbs/>` trail
 */
export type BreadcrumbItemType = {
    /** Displayed label for this crumb */
    label: RenderableElements
    /** URL for this crumb; omit for the current page (rendered as plain text, not a link) */
    to?: string
    /**
     * Content shown immediately before the label - an `Avatar` for a project or group, an `Icon`
     * for a section.
     *
     * A slot rather than an image path, so a crumb can carry whatever it needs and a consumer is
     * not limited to one shape of thing. It is decoration beside a label that already names the
     * destination, so give it `alt=""` or mark it `aria-hidden` unless it says something the label
     * does not.
     */
    leading?: RenderableElements
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
    /** Forwarded to every crumb's underlying `Link` - see its own `spa` attr (default `false`) for the full SPA-vs-multi-page-site explanation */
    spa?: boolean
    /**
     * The most crumbs to show at once before the middle of the trail collapses behind an expander
     * (default: unset, which always shows every crumb).
     *
     * Set, a longer trail renders as the first crumb, the expander, and the last `maxItems - 2`
     * crumbs - so exactly `maxItems` slots either way. The root and the current page are the two
     * a reader actually navigates by, which is why those are the ends that survive. Values below
     * 3 leave no room for both ends and an expander, and are treated as 3.
     */
    maxItems?: number
    /** Content of the expander that reveals the collapsed crumbs (default: `BreadcrumbsThemeOptions.collapseSymbol` - a plain "…", not English text) */
    expandButtonChildren?: RenderableElements
    /**
     * Accessible name for that expander, e.g. "Show the rest of the trail".
     *
     * No default, like every other ARIA label here - see CLAUDE.md's language-agnostic rule. Worth
     * setting: the expander's own content is a glyph, so without it the control has no name at all.
     */
    expandLabel?: string
} & IdAttr & StylePassthroughAttrs

let areBreadcrumbsStylesMounted = false

/** The smallest `maxItems` that still leaves room for both ends of the trail plus the expander */
const MIN_MAX_ITEMS = 3

/**
 * Splits a trail into the crumbs shown at the start, the ones hidden behind the expander, and the
 * ones shown at the end.
 *
 * Collapsing is driven by the number of crumbs rather than by the width they happen to occupy.
 * Measuring would mean reading layout on every resize to answer a question the caller already
 * knows the answer to, and it makes the same trail render differently on two screens - where a
 * count is the same everywhere and is something a test can pin down.
 */
function splitTrail(items: BreadcrumbItemType[], maxItems: number | undefined): {
    head: BreadcrumbItemType[]
    collapsed: BreadcrumbItemType[]
    tail: BreadcrumbItemType[]
} {
    if (maxItems === undefined || items.length <= Math.max(maxItems, MIN_MAX_ITEMS)) {
        return {head: items, collapsed: [], tail: []}
    }
    const limit = Math.max(maxItems, MIN_MAX_ITEMS)
    // One slot for the first crumb and one for the expander; the rest go to the end of the trail
    const tailCount = limit - 2
    return {
        head: items.slice(0, 1),
        collapsed: items.slice(1, items.length - tailCount),
        tail: items.slice(items.length - tailCount),
    }
}

/** Stylesheet for `<Breadcrumbs/>`, mounted once on first construction */
const breadcrumbsCss: string = `
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
` +
/* The crumb's anchor is the target, so it carries the 24px floor rather than the row around it */
`
.vtd-breadcrumbs-item a{color:inherit;display:inline-flex;align-items:center;min-height:24px;}
.vtd-breadcrumbs-item[aria-current="page"]{font-weight:bold;}
.vtd-breadcrumbs-separator{
margin-inline:0.5em;
color:var(--background-6);
}
` +
/* A crumb's label and its leading content read as one thing, so they sit on one baseline */
`
.vtd-breadcrumbs-crumb{display:inline-flex;align-items:center;gap:0.4em;}
.vtd-breadcrumbs-leading{display:inline-flex;align-items:center;flex-shrink:0;}
.vtd-breadcrumbs-expand{
cursor:pointer;
color:var(--background-7);
padding:0 0.3em;
border-radius:0.25rem;
line-height:1;
}
.vtd-breadcrumbs-expand:hover{background-color:var(--background-1);color:var(--text);}
`

/**
 * A navigational trail showing where the current page sits in the site hierarchy.
 *
 * Two things a long or richly-labelled trail needs, both opt-in:
 *
 * - **`leading`** puts an avatar or icon beside a crumb's label.
 * - **`maxItems`** collapses the middle of the trail behind an expander once it grows past that
 *   many crumbs, keeping the root and the current page. The expander is a `Menu`, so the hidden
 *   crumbs are a real disclosure with the keyboard handling and outside-click behaviour that
 *   component already owns, rather than a second implementation of the same thing.
 */
export const Breadcrumbs: FunctionComponent<BreadcrumbsAttrsType> = function(attrs: BreadcrumbsAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areBreadcrumbsStylesMounted) {
        areBreadcrumbsStylesMounted = true
        mountStyles(breadcrumbsCss, "vtd/Breadcrumbs")
    }

    const {head, collapsed, tail} = splitTrail(attrs.items, attrs.maxItems)
    const separator = attrs.separator || "/"

    /** A crumb's own content: its leading slot, if any, then its label */
    const crumbContent = (item: BreadcrumbItemType) => item.leading
        ? <span class="vtd-breadcrumbs-crumb"><span class="vtd-breadcrumbs-leading">{item.leading}</span>{item.label}</span>
        : item.label

    /**
     * One crumb, plus the separator that follows it.
     *
     * `last` is passed rather than compared against the items array, because the trail is rendered
     * from three pieces and only the very final crumb should go without a trailing separator.
     */
    const crumb = (item: BreadcrumbItemType, last: boolean) => <li
        class="vtd-breadcrumbs-item"
        aria-current={item.to ? undefined : "page"}>
        {item.to ? <Link to={item.to} spa={attrs.spa}>{crumbContent(item)}</Link> : <span>{crumbContent(item)}</span>}
        {last ? null : <span class="vtd-breadcrumbs-separator" aria-hidden="true">{separator}</span>}
    </li>

    const expander = collapsed.length > 0
        ? <li class="vtd-breadcrumbs-item">
            <Menu
                ariaLabel={attrs.expandLabel}
                trigger={<span class="vtd-breadcrumbs-expand">
                    {attrs.expandButtonChildren || <BreadcrumbsThemeOptions.collapseSymbol/>}
                </span>}
                items={collapsed.map((item): MenuItemType => ({
                    label: crumbContent(item),
                    href: item.to,
                    spa: attrs.spa,
                }))}/>
            <span class="vtd-breadcrumbs-separator" aria-hidden="true">{separator}</span>
        </li>
        : null

    return passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-breadcrumbs">
        <ol class="vtd-breadcrumbs-list">
            {head.map((item, index) => crumb(item, collapsed.length == 0 && index == head.length - 1))}
            {expander}
            {tail.map((item, index) => crumb(item, index == tail.length - 1))}
        </ol>
    </nav>, attrs)
}
