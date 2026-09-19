import { Component, getComponent, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"

import { Button, ColorScheme, Empty, highlightMatch, I, Link, NavLink, Navbar, searchHighlightCss, Text, TextBox, Tree } from "../../src/index.ts"
import { categoryIconKey } from "./data/category-icons.ts"
import type { TreeNodeType } from "../../src/index.ts"
import { docBySlug, groupByGroupSlug, groupedDocs } from "./data/docs.tsx"
import { HomePage } from "./pages/home.tsx"
import { ComponentPage } from "./pages/component-page.tsx"
import { CategoryPage, categoryPageUrl } from "./pages/category-page.tsx"
import { NotFoundPage } from "./pages/not-found.tsx"
import { ThemeBuilderPage } from "./pages/theme-builder.tsx"

/**
 * The grouped, searchable sidebar list of every documented component - a `Tree`, one branch per
 * category.
 *
 * This is the showcase doing what it exists to do: using the package the way a consumer would. It
 * was a hand-rolled list of `<div>`s before, and moving it onto `Tree` is what surfaced three
 * things `Tree` was missing - see CLAUDE.md's Tree section.
 *
 * **No `onSelect`.** Each entry's `label` is a `NavLink`, which tracks `location.pathname` itself
 * and owns its own click; a leaf without `onSelect` is a plain container rather than something
 * claiming to be a button, so the link is the only control in the row. Passing `onSelect` here
 * would put a button around a link and fire both.
 *
 * `setFilter` rebuilds via `refresh()`, because a search edit genuinely changes which entries
 * exist. Losing the reader's expansions across that rebuild is the part that needed care:
 * `#openCategories` remembers what they opened, `getOpenKeys()` reads it back off the live tree
 * whenever they toggle, and the rebuild re-applies it through `defaultOpen`. While a filter is
 * active every surviving category opens instead, so a match is never hidden inside a collapsed
 * branch - typing "bu" opens Form so Button is visible without a second click.
 */
class SidebarList extends Component<EmptyAttrs> {
    #filterText = ""
    /** What the reader has expanded, kept across the rebuilds a filter edit causes */
    #openCategories = new Set<string>()
    #tree?: Tree

    setFilter(text: string) {
        this.#filterText = text
        this.refresh()
    }

    override render(): HTMLDivElement {
        const filterLower = this.#filterText.trim().toLowerCase()
        const filtering = filterLower.length > 0
        const buckets = groupedDocs()
            .map(bucket => ({group: bucket.group, docs: bucket.docs.filter(doc => doc.name.toLowerCase().includes(filterLower))}))
            .filter(bucket => bucket.docs.length > 0)

        if (buckets.length == 0) {
            return <div class="vtd-showcase-sidebar-list">
                <Empty description={`No components match "${this.#filterText}"`}/>
            </div>
        }

        const nodes: TreeNodeType[] = buckets.map(bucket => ({
            key: bucket.group,
            // The category name links to its own page, and is also what toggles the branch: the
            // click lands on the link, so Tree's summary handler sees defaultPrevented and leaves
            // the toggle to the chevron and the rest of the row.
            label: <Link spa to={categoryPageUrl(bucket.group)} class="vtd-showcase-sidebar-group-label">{bucket.group}</Link>,
            // The icon is the whole row when the sidebar is collapsed to its rail, so it is not
            // decoration - it is the only thing identifying the category at that width
            leading: <I i={categoryIconKey(bucket.group)} class="vtd-showcase-sidebar-icon"/>,
            // Trailing, not leading: a count announced *before* the category name reads as
            // "3 Typography", and reordering a leading slot in CSS would leave that wrong for a
            // screen reader while looking right on screen
            trailing: <Text type="muted" class="vtd-showcase-sidebar-count">{bucket.docs.length}</Text>,
            // A filter reveals every category that still has a match; otherwise the reader's own
            // expansions are restored
            defaultOpen: filtering || this.#openCategories.has(bucket.group),
            children: bucket.docs.map(doc => ({
                key: doc.slug,
                // highlightMatch marks the substring that matched, so the reader can see *why* an
                // entry survived the filter rather than having to work it out. It is the same
                // helper Combobox, Command and both tables use, so a filtered list looks the same
                // everywhere in the package.
                label: <NavLink
                    spa
                    to={`/components/${doc.slug}`}
                    activeClass="vtd-showcase-sidebar-item-active"
                    class="vtd-showcase-sidebar-item">{highlightMatch(doc.name, filterLower)}</NavLink>,
            })),
        }))

        this.#tree = getComponent<Tree>(<Tree
            class="vtd-showcase-sidebar-tree"
            ariaLabel="Components by category"
            nodes={nodes}
            onToggle={() => {
                // Read the whole state back rather than tracking one node's change: while a filter
                // is active the tree holds categories the reader never opened, and only what they
                // have open *now* should survive the filter being cleared.
                if (this.#tree && !this.#filterText.trim()) {
                    this.#openCategories = new Set(this.#tree.getOpenKeys())
                }
            }}/>)

        return <div class="vtd-showcase-sidebar-list">{this.#tree}</div>
    }
}

/** Swaps between Home / a component's detail page / Not Found based on `location.pathname` */
class ContentArea extends Component<EmptyAttrs> {
    #handleLocationChange = () => {
        globalThis.scrollTo({top: 0})
        this.refresh()
    }

    override mount() {
        globalThis.addEventListener("popstate", this.#handleLocationChange)
        globalThis.addEventListener("locationchange", this.#handleLocationChange)
    }
    override unmount() {
        globalThis.removeEventListener("popstate", this.#handleLocationChange)
        globalThis.removeEventListener("locationchange", this.#handleLocationChange)
    }

    override render(): RenderableElements {
        const pathname = globalThis.location.pathname
        if (pathname == "/" || pathname == "") {
            return <HomePage/>
        }
        if (pathname == "/theme" || pathname == "/theme/") {
            return <ThemeBuilderPage/>
        }
        const componentMatch = pathname.match(/^\/components\/([a-z0-9-]+)\/?$/)
        if (componentMatch) {
            const doc = docBySlug(componentMatch[1])
            if (doc) {
                return <ComponentPage doc={doc}/>
            }
        }
        const categoryMatch = pathname.match(/^\/category\/([a-z0-9-]+)\/?$/)
        if (categoryMatch) {
            const bucket = groupByGroupSlug(categoryMatch[1])
            if (bucket) {
                return <CategoryPage group={bucket.group} docs={bucket.docs}/>
            }
        }
        return <NotFoundPage/>
    }
}

const sidebarCollapsedKey = "vtd-showcase-sidebar-collapsed"

/** Whether the reader left the sidebar collapsed to its icon rail */
function loadSidebarCollapsed(): boolean {
    try {
        return localStorage.getItem(sidebarCollapsedKey) == "true"
    } catch {
        return false
    }
}

function saveSidebarCollapsed(collapsed: boolean) {
    try {
        localStorage.setItem(sidebarCollapsedKey, String(collapsed))
    } catch { /* private browsing with storage disabled - the toggle still works for this session */ }
}

let areShellStylesMounted = false

/**
 * The persistent page shell: header (brand, dark-mode toggle) and a body split between the
 * searchable sidebar and the routed content area. Built once here (like `Modal`/`ExplorerApp`)
 * and never refreshed as a whole - `SidebarList` and `ContentArea` each manage their own
 * targeted re-renders.
 */
export class AppShell extends Component<EmptyAttrs> {
    #root: HTMLDivElement
    #sidebarList: SidebarList

    constructor(attrs: EmptyAttrs, children: RenderableElements[]) {
        super(attrs, children)
        if (!areShellStylesMounted) {
            areShellStylesMounted = true
            setStylesheet(`
.vtd-showcase-shell{display:flex;flex-direction:column;min-height:100vh;}
/* Navbar supplies the bar itself; this only makes it stick to the top of the viewport */
.vtd-showcase-header{position:sticky;top:0;background-color:var(--background);z-index:2;}
.vtd-showcase-brand{font-size:1.15em;font-weight:bold;color:inherit;text-decoration:none;}
.vtd-showcase-header-link{color:inherit;text-decoration:none;font-size:0.9em;padding:0.4em 0.6em;border-radius:0.25rem;}
.vtd-showcase-header-link:hover{background-color:var(--background-2);}
.vtd-showcase-body{display:flex;flex-grow:1;min-height:0;}
.vtd-showcase-sidebar-wrapper{
width:250px;
flex-shrink:0;
position:sticky;
top:53px;
align-self:flex-start;
height:calc(100vh - 53px);
transition:width 0.18s ease-in-out;
}
/*
 * The panel is absolutely positioned inside the wrapper so that expanding it on hover lays it
 * *over* the page rather than shoving the content sideways. The wrapper keeps the gutter; only
 * the panel grows. position:sticky on the wrapper makes it the containing block for this.
 */
.vtd-showcase-sidebar-panel{
position:absolute;
inset-block:0;
inset-inline-start:0;
width:250px;
display:flex;
flex-direction:column;
background-color:var(--background);
border-inline-end:1px solid var(--background-4);
overflow:hidden;
transition:width 0.18s ease-in-out, box-shadow 0.18s ease-in-out;
}
/*
 * Collapsed, the wrapper is a 56px rail and the panel matches it - wide enough for the category
 * icons and nothing else. Hover or keyboard focus floats the full panel back out over the page;
 * focus-within matters as much as hover, or the sidebar would be unusable from the keyboard.
 */
.vtd-showcase-sidebar-collapsed{width:56px;}
.vtd-showcase-sidebar-collapsed .vtd-showcase-sidebar-panel{width:56px;}
.vtd-showcase-sidebar-collapsed:hover .vtd-showcase-sidebar-panel,
.vtd-showcase-sidebar-collapsed:focus-within .vtd-showcase-sidebar-panel{
width:250px;
box-shadow:0 2px 14px rgba(0,0,0,0.18);
z-index:3;
}
/*
 * Everything except the icons is hidden at rail width. visibility rather than display:none:
 * the rows keep their layout, so nothing jumps as the panel slides open, and a screen reader still
 * reaches the labels.
 */
.vtd-showcase-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-showcase-sidebar-search,
.vtd-showcase-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-label-main,
.vtd-showcase-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-trailing,
.vtd-showcase-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-disclosure-content{
visibility:hidden;
}
/* The chevron is meaningless on a rail of icons */
.vtd-showcase-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-label::before{opacity:0;}
.vtd-showcase-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-showcase-sidebar-icon{font-size:1.35em;}
/* The toggle sits at the foot of the panel, out of the way of the list */
.vtd-showcase-sidebar-toggle-row{
border-block-start:1px solid var(--background-4);
padding:0.5em;
flex-shrink:0;
}
.vtd-showcase-sidebar-toggle{width:100%;}
.vtd-showcase-sidebar-search{padding:0.75em;border-block-end:1px solid var(--background-4);}
.vtd-showcase-sidebar-search .vtd-text-box{width:100%;margin-inline-start:0;box-sizing:border-box;}
.vtd-showcase-sidebar-list{overflow-y:auto;flex-grow:1;padding-block-end:1em;}
/*
 * Tree supplies the disclosure, the chevron and the indentation; these rules restyle it for a
 * navigation sidebar rather than a file listing. Targeting Tree's classes is the supported way to
 * do that - the class is the API, the tag it happens to render is not.
 */
.vtd-showcase-sidebar-tree{padding:0.5em 0.35em;}
/* A category row: small caps, and the whole row is the hit target for the disclosure */
.vtd-showcase-sidebar-tree .vtd-tree-label{padding:0.5em 0.55em;}
.vtd-showcase-sidebar-group-label{
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-9);
text-decoration:none;
}
.vtd-showcase-sidebar-group-label:hover{color:var(--primary-8);}
/* Tree's own trailing slot already sits at the far edge; this only sizes it */
.vtd-showcase-sidebar-tree .vtd-tree-trailing{font-size:0.75em;}
/* A leaf is only a wrapper here - the NavLink inside it is the whole row */
.vtd-showcase-sidebar-tree .vtd-tree-leaf{padding:0;margin-inline-start:0.6em;border-radius:0;}
.vtd-showcase-sidebar-tree .vtd-tree-leaf:hover{background-color:transparent;}
.vtd-showcase-sidebar-tree .vtd-tree-children{padding-inline-start:0.75em;}
.vtd-showcase-sidebar-item{
display:block;
padding:0.35em 0.6em;
border-radius:0.25rem;
color:inherit;
text-decoration:none;
font-size:0.95em;
}
.vtd-showcase-sidebar-item:hover{background-color:var(--background-2);}
.vtd-showcase-sidebar-item-active{background-color:var(--primary-2);font-weight:bold;}
.vtd-showcase-main{flex-grow:1;min-width:0;}
/*
 * The frame every routed page draws itself in. It belongs to the shell rather than to any one
 * page: the component pages and the theme builder both wear it, and while it lived in
 * ComponentPage's stylesheet the theme builder had no padding at all until the reader happened to
 * visit a component page first - a cold load of /theme put its heading flat against the sidebar.
 * A page's own layout stays in that page's stylesheet; this is only the frame.
 */
.vtd-showcase-doc{padding:2em;max-width:62em;min-width:0;flex-grow:1;}
/* Paragraph supplies the colour; this only sizes and spaces a page's lede */
.vtd-showcase-doc-description{font-size:1.05em;margin-block-end:1.5em;max-width:44em;}
${searchHighlightCss}
`, "velodesign-showcase/AppShell")
        }

        const searchInput: HTMLInputElement = <TextBox
            type="text"
            placeholder="Search components..."
            class="vtd-showcase-search"
            onInput={(event: Event) => {
                if (event.target instanceof HTMLInputElement) { this.#sidebarList.setFilter(event.target.value) }
            }}/>

        this.#sidebarList = getComponent<SidebarList>(<SidebarList/>)
        const content = getComponent<ContentArea>(<ContentArea/>)

        // The collapse toggle flips one class on the wrapper rather than re-rendering anything.
        // Rebuilding the sidebar here would throw away the reader's expansions and their search,
        // and the change is purely presentational - exactly the case for a class toggle.
        const collapseLabel = new RenderBasic<string>(loadSidebarCollapsed() ? "Expand" : "Collapse")
        const collapseToggle: HTMLButtonElement = <Button
            type="text"
            class="vtd-showcase-sidebar-toggle"
            ariaLabel="Collapse or expand the sidebar"
            onClick={() => {
                const wrapper = collapseToggle.closest(".vtd-showcase-sidebar-wrapper") as HTMLElement
                const collapsed = wrapper.classList.toggle("vtd-showcase-sidebar-collapsed")
                collapseLabel.value = collapsed ? "Expand" : "Collapse"
                collapseToggle.setAttribute("aria-expanded", collapsed ? "false" : "true")
                saveSidebarCollapsed(collapsed)
            }}>{collapseLabel}</Button>
        collapseToggle.setAttribute("aria-expanded", loadSidebarCollapsed() ? "false" : "true")

        const darkModeLabel = new RenderBasic<string>(ColorScheme.getColorScheme() == "light" ? "off" : "on")
        const themeToggle = <Button type="secondary" onClick={() => {
            if (ColorScheme.getColorScheme() == "light") {
                ColorScheme.setColorScheme("dark")
                darkModeLabel.value = "on"
            } else {
                ColorScheme.setColorScheme("light")
                darkModeLabel.value = "off"
            }
        }}>Dark mode: {darkModeLabel}</Button>

        this.#root = <div class="vtd-showcase-shell">
            {/* Navbar's own `brand` / `leading` / children slots, rather than a hand-built
                <header>: the brand sits far left, the tagline beside it via `leading`, and
                children are pushed to the right automatically. */}
            <Navbar
                class="vtd-showcase-header"
                brand={<Link spa to="/" class="vtd-showcase-brand">velodesign</Link>}
                leading={<Text type="muted">Component showcase</Text>}>
                <Link spa to="/theme" class="vtd-showcase-header-link">Theme builder</Link>
                {themeToggle}
            </Navbar>
            <div class="vtd-showcase-body">
                <aside class={`vtd-showcase-sidebar-wrapper${loadSidebarCollapsed() ? " vtd-showcase-sidebar-collapsed" : ""}`}>
                    <div class="vtd-showcase-sidebar-panel">
                        <div class="vtd-showcase-sidebar-search">{searchInput}</div>
                        {this.#sidebarList}
                        <div class="vtd-showcase-sidebar-toggle-row">{collapseToggle}</div>
                    </div>
                </aside>
                <main class="vtd-showcase-main">{content}</main>
            </div>
        </div>
    }

    override render(): HTMLDivElement {
        return this.#root
    }
}
