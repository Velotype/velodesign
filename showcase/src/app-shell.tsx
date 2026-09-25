import { Component, getComponent, RenderObject, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"

import { Avatar, ColorScheme, Combobox, highlightMatch, History, I, Link, Navbar, searchHighlightCss, Sidebar, Text, TextBox } from "@velotype/velodesign"
import type { SidebarNavState } from "@velotype/velodesign"
import { categoryIconKey, homeIconKey, searchIconKey, themeIconKey } from "./data/category-icons.ts"
import type { MenuItemType, SidebarItemType } from "@velotype/velodesign"
import { componentDocs, docBySlug, groupByGroupSlug, groupedDocs } from "./data/docs.tsx"
import { HomePage } from "./pages/home.tsx"
import { ComponentPage } from "./pages/component-page.tsx"
import { CategoryPage, categoryPageUrl } from "./pages/category-page.tsx"
import { NotFoundPage } from "./pages/not-found.tsx"
import { ThemeBuilderPage } from "./pages/theme-builder.tsx"

/**
 * The showcase's entries for `Sidebar`, rebuilt whenever the search changes.
 *
 * Everything this used to do by hand - the collapsible rail, the icons, the account row, the
 * resize handle, marking the category that holds the current page - belongs to the component now.
 * That is the point of the showcase: if a behaviour is worth having here it is worth having in the
 * package, and a private copy is how the two drift apart.
 *
 * The open/closed state still lives here, because only this page knows what a filter means.
 * `#openCategories` remembers what the reader expanded, read back off the live tree whenever they
 * toggle; while a filter is active every surviving category is forced open, so a match is never
 * hidden inside a collapsed group - typing "bu" opens Form so Button is visible without a second
 * click.
 */
function buildSidebarItems(filterText: string, openCategories: Set<string>): SidebarItemType[] {
    const filterLower = filterText.trim().toLowerCase()
    const filtering = filterLower.length > 0
    return groupedDocs()
        // A category name is a search term like any other, and it is the one a reader who does not
        // yet know a component's name actually has: typing "chart" found nothing at all while every
        // chart sat one level down inside a category called Charts. A category that matches keeps
        // all of its components rather than none - the match is the category itself.
        .map(bucket => ({
            group: bucket.group,
            docs: bucket.group.toLowerCase().includes(filterLower)
                ? bucket.docs
                : bucket.docs.filter(doc => doc.name.toLowerCase().includes(filterLower)),
        }))
        .filter(bucket => bucket.docs.length > 0)
        .map<SidebarItemType>(bucket => ({
            key: bucket.group,
            // `to` rather than a Link inside the label, which is what this used to be. Sidebar
            // turns an entry with a destination into one link covering the icon, the name and the
            // count, leaving the chevron as the only thing that toggles - so the whole row goes to
            // the category page and the two actions stop competing for the same surface. It is
            // also what marks the group while the reader is *on* that page: NavLink decides what is
            // active, and a plain Link never claimed to be.
            to: categoryPageUrl(bucket.group),
            label: highlightMatch(bucket.group, filterLower),
            icon: <I i={categoryIconKey(bucket.group)}/>,
            // Trailing, not leading: a count announced *before* the category name reads as
            // "3 Typography", and reordering a leading slot in CSS would leave that wrong for a
            // screen reader while looking right on screen
            trailing: <Text type="muted" class="vtd-showcase-sidebar-count">{bucket.docs.length}</Text>,
            defaultOpen: filtering || openCategories.has(bucket.group),
            children: bucket.docs.map(doc => ({
                key: doc.slug,
                to: `/components/${doc.slug}`,
                // highlightMatch marks the substring that matched, so the reader can see *why* an
                // entry survived the filter rather than having to work it out. It is the same
                // helper Combobox, Command and both tables use.
                label: highlightMatch(doc.name, filterLower),
            })),
        }))
        .concat(themeBuilderItem(filterLower, filtering))
}

/**
 * The Theme builder's own row, under a rule at the foot of the list.
 *
 * It is a page of the showcase rather than a component category, and it used to be a link in the
 * Navbar - which put the two kinds of destination in two different places, and left the sidebar
 * holding only the thing it was already showing. Down here the navigation is in one list.
 *
 * It is also the two shapes the categories above never exercise: an entry with **no children**,
 * which is a plain link rather than a group with a chevron, and a category the docs did not
 * generate. Both are supported and neither was used anywhere, so neither was ever seen.
 *
 * It answers the filter like any other entry, since a reader typing "theme" is looking for
 * something and an empty list is the wrong answer.
 */
function themeBuilderItem(filterLower: string, filtering: boolean): SidebarItemType[] {
    if (filtering && !"theme builder".includes(filterLower)) {
        return []
    }
    return [{
        key: "theme-builder",
        to: "/theme",
        label: highlightMatch("Theme builder", filterLower),
        icon: <I i={themeIconKey}/>,
        dividerBefore: true,
    }]
}

/**
 * Everything the Navbar search can take you to: every category, then every component.
 *
 * Categories are in the list because they are real destinations with pages of their own, and
 * leaving them out meant typing "Data Entry" offered the ten components inside it and no way to
 * reach the category itself - the one result a reader typing a category name most likely wants.
 * They come first for the same reason: the broad destination above the narrow ones it contains.
 *
 * Built once, lazily, rather than at module scope - `groupedDocs()` reads `componentDocs`, which is
 * declared further down its own module.
 */
type SearchEntry = {
    value: string
    kind: "category" | "component" | "page"
    /** Which category's glyph the row draws - its own, for a category */
    group: string
    /** The trailing note: a component's category, how many a category holds, or what a page is */
    detail: string
    url: string
    /** Overrides the glyph, for a destination that is not a category and holds no components */
    icon?: string
}

/** Destinations that are neither a category nor a component - kept beside the sidebar's own tail */
const standalonePages: SearchEntry[] = [
    {value: "Theme builder", kind: "page", group: "", detail: "Page", url: "/theme", icon: themeIconKey},
    {value: "Home", kind: "page", group: "", detail: "Page", url: "/", icon: homeIconKey},
]

let cachedSearchEntries: SearchEntry[] | undefined
function searchEntries(): SearchEntry[] {
    if (!cachedSearchEntries) {
        cachedSearchEntries = [
            ...groupedDocs().map((bucket): SearchEntry => ({
                value: bucket.group,
                kind: "category",
                group: bucket.group,
                detail: `${bucket.docs.length} components`,
                url: categoryPageUrl(bucket.group),
            })),
            ...componentDocs.map((doc): SearchEntry => ({
                value: doc.name,
                kind: "component",
                group: doc.group,
                detail: doc.group,
                url: `/components/${doc.slug}`,
            })),
            // The pages that are destinations without being a category or a component. Easy to
            // forget precisely because they are not generated from the docs: the Theme builder is
            // in the sidebar and was in the Navbar before that, and was still unreachable by
            // searching for it. Anything added to the sidebar's own tail belongs here too.
            ...standalonePages,
        ]
    }
    return cachedSearchEntries
}

let cachedSearchEntryByValue: Map<string, SearchEntry> | undefined
function searchEntryByValue(): Map<string, SearchEntry> {
    if (!cachedSearchEntryByValue) {
        cachedSearchEntryByValue = new Map(searchEntries().map(entry => [entry.value, entry]))
    }
    return cachedSearchEntryByValue
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

const sidebarWidthKey = "vtd-showcase-sidebar-width"

/** The width the reader last dragged the sidebar to */
function loadSidebarWidth(): number {
    try {
        const stored = Number(localStorage.getItem(sidebarWidthKey))
        return Number.isFinite(stored) && stored > 0 ? stored : 250
    } catch {
        return 250
    }
}

function saveSidebarWidth(width: number) {
    try {
        localStorage.setItem(sidebarWidthKey, String(width))
    } catch { /* as above - the drag still works, it just isn't remembered */ }
}

/**
 * The Light / Dark / System group for the account menu.
 *
 * `selected` is a function, not a boolean, because the header's own dark-mode button changes the
 * same setting: a reading taken when the menu was built would describe whatever was true then, and
 * `Menu` re-reads a function every time it opens. It reads the *preference* rather than the scheme
 * in effect - `getColorScheme` has already resolved System to light or dark, so it would tick Light
 * for a reader who asked to follow a browser that happens to prefer it.
 */
function themeMenuItems(apply: (scheme: "light" | "dark" | "default") => void): MenuItemType[] {
    const selected = (scheme: string) => () => ColorScheme.getColorSchemePreference() == scheme
    return [
        {label: "Light", keepOpen: true, selected: selected("light"), onClick: () => apply("light")},
        {label: "Dark", keepOpen: true, selected: selected("dark"), onClick: () => apply("dark")},
        {label: "System", keepOpen: true, selected: selected("default"), onClick: () => apply("default")},
    ]
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
    #searchInput!: HTMLElement
    #navbarSearchSlot!: HTMLElement
    #sidebarSearchSlot!: HTMLElement
    #searchInOverlay: boolean | undefined
    #nav!: RenderObject<SidebarNavState>
    #sidebar: Sidebar
    /** What the reader has expanded, kept across the item rebuilds a search edit causes */
    #openCategories = new Set<string>()
    #filterText = ""

    /**
     * The one path every theme change here goes through.
     *
     * One control sets it now - the account menu's Theme group - where it sits beside the account's
     * other settings and offers System as well as the two it used to toggle between. It needs
     * nothing pushed to it, because its `selected` entries are functions and are re-read each time
     * the menu opens; the Navbar's own on/off button did need pushing, and is gone with it.
     */
    #applyColorScheme(scheme: "light" | "dark" | "default") {
        ColorScheme.setColorScheme(scheme)
    }

    constructor(attrs: EmptyAttrs, children: RenderableElements[]) {
        super(attrs, children)
        if (!areShellStylesMounted) {
            areShellStylesMounted = true
            setStylesheet(`
.vtd-showcase-shell{display:flex;flex-direction:column;min-height:100vh;}
/* Navbar supplies the bar itself; this only makes it stick to the top of the viewport */
.vtd-showcase-header{position:sticky;top:0;background-color:var(--background);z-index:1;}
.vtd-showcase-brand{font-size:1.15em;font-weight:bold;color:inherit;text-decoration:none;}
.vtd-showcase-header-link{color:inherit;text-decoration:none;font-size:0.9em;padding:0.4em 0.6em;border-radius:0.25rem;}
.vtd-showcase-header-link:hover{background-color:var(--background-2);}
.vtd-showcase-body{display:flex;flex-grow:1;min-height:0;}
/*
 * Sidebar owns the panel, the rail, the collapse control, the resize handle and the account row.
 * What is left here is the page's placement of it - sticky under the header, in the chrome layer -
 * plus the few things that are genuinely this site's own: the search box, the category label and
 * the per-category count.
 */
.vtd-showcase-sidebar{
position:sticky;
/*
 * Measured, never assumed. This was top:53px against a header that is actually 55px tall, so once
 * the page scrolled the sidebar pinned two pixels high and painted over the header's bottom border
 * for the width of the sidebar - the line between the two simply vanished, but only after a
 * scroll, which is what made it look intermittent. A hardcoded offset is wrong the moment anything
 * in the header changes size, which includes the reader's own font settings.
 */
top:var(--vtd-showcase-header-height,55px);
/* The chrome layer - see the note on .vtd-showcase-main. Same value as the header, because they
   are the same layer and never overlap each other */
z-index:1;
align-self:flex-start;
height:calc(100vh - var(--vtd-showcase-header-height,55px));
}
.vtd-showcase-sidebar-search .vtd-text-box-wrapper{width:100%;}
.vtd-showcase-sidebar-search .vtd-text-box{width:100%;margin-inline-start:0;box-sizing:border-box;}
.vtd-showcase-sidebar-search-icon{
display:inline-flex;
align-items:center;
justify-content:center;
width:2em;
height:2em;
padding:0;
background:transparent;
border:1px solid transparent;
border-radius:0.25rem;
color:inherit;
cursor:pointer;
}
.vtd-showcase-sidebar-search-icon:hover{background-color:var(--background-2);}
.vtd-showcase-sidebar-search-icon:focus-visible{border-color:var(--primary);outline:none;}
/* A category's own name, which is the label of a Tree branch - the one row shape a leaf never has */
.vtd-showcase-sidebar .vtd-tree-label .vtd-sidebar-label{
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-9);
}
.vtd-showcase-sidebar .vtd-tree-label .vtd-sidebar-link:hover .vtd-sidebar-label{color:var(--primary-8);}
.vtd-showcase-sidebar .vtd-tree-label .vtd-nav-link-active .vtd-sidebar-label{color:var(--primary-8);}
.vtd-showcase-sidebar-count{font-size:0.75em;}
/*
 * The search box's two homes.
 *
 * In the Navbar it is given a width rather than left to the input's default size, which is about
 * 20 characters and reads as an afterthought beside the brand. It shrinks before it wraps, so a
 * mid-width window narrows the box instead of pushing the theme control onto a second line.
 */
.vtd-showcase-search-slot{display:flex;align-items:center;min-width:0;}
.vtd-showcase-search-slot .vtd-showcase-search{width:min(22em,40vw);}
/* The Navbar's box is only in use at the width where the sidebar is a column of its own */
.vtd-showcase-search-in-navbar .vtd-showcase-search-slot{display:flex;}
.vtd-showcase-search-slot{display:none;}
/* A result is an icon, the component, then its category pushed to the trailing edge - so a row of
   three Buttons is told apart by the one part of it that differs */
.vtd-showcase-result{display:flex;align-items:center;gap:0.5em;width:100%;min-width:0;}
.vtd-showcase-result-icon{color:var(--primary-7);flex-shrink:0;}
.vtd-showcase-result-name{flex-grow:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.vtd-showcase-result-group{font-size:0.8em;flex-shrink:0;}
/* While the box is in the Navbar the sidebar's header is an empty strip, so it is not drawn at all
   - including on the rail, where the magnifier that stood in for the box has nothing to stand for */
.vtd-showcase-search-in-navbar .vtd-showcase-sidebar .vtd-sidebar-header{display:none;}
.vtd-showcase-main{flex-grow:1;min-width:0;isolation:isolate;}
/*
 * The frame every routed page draws itself in. It belongs to the shell rather than to any one
 * page: the component pages and the theme builder both wear it, and while it lived in
 * ComponentPage's stylesheet the theme builder had no padding at all until the reader happened to
 * visit a component page first - a cold load of /theme put its heading flat against the sidebar.
 * A page's own layout stays in that page's stylesheet; this is only the frame.
 */
.vtd-showcase-doc{padding:2em;max-width:62em;min-width:0;flex-grow:1;}
/*
 * The dotted frame an example is drawn in. Shared by the component and category pages, so it lives
 * here: defined in both page sheets, whichever page was visited last decided its corners.
 */
.vtd-showcase-example-preview{
border:1px solid var(--background-4);
border-radius:0.5rem;
padding:2em;
display:flex;
align-items:center;
min-height:3em;
background-image:radial-gradient(color-mix(in srgb, var(--background-4) 35%, transparent) 1px, transparent 1px);
background-size:16px 16px;
}
/* Paragraph supplies the colour; this only sizes and spaces a page's lede */
.vtd-showcase-doc-description{font-size:1.05em;margin-block-end:1.5em;max-width:44em;}
${searchHighlightCss}
`, "velodesign-showcase/AppShell")
        }

        // clearable: this is the case it exists for - a box the reader edits repeatedly and
        // abandons, where emptying it by hand is several keystrokes
        const searchInput: HTMLElement = <TextBox
            type="text"
            clearable
            clearLabel="Clear the search"
            placeholder="Search components..."
            class="vtd-showcase-search"
            onInput={(event: Event) => {
                if (event.target instanceof HTMLInputElement) { this.#setFilter(event.target.value) }
            }}/>

        /*
         * Two searches, because at the two widths they are different jobs.
         *
         * Wide, the box is in the Navbar and the sidebar is across the page from it: filtering the
         * sidebar from there meant typing in one corner and watching a list rearrange itself in
         * another, with nothing connecting the two. So the Navbar box is a Combobox - the matches
         * drop out of the box the reader is typing into, and picking one goes there. The sidebar
         * is left alone, a stable list of every category.
         *
         * Narrow, the sidebar *is* the surface and the box sits at the top of it, directly above
         * the entries. Filtering in place is the connected thing to do there, so that stays a
         * plain TextBox over the list.
         */
        this.#navbarSearchSlot = <div class="vtd-showcase-search-slot">{<Combobox
            class="vtd-showcase-search"
            placeholder="Search components..."
            noMatchMessage={<Text type="muted">No component matches</Text>}
            clearOnSelect
            options={searchEntries().map(entry => ({
                value: entry.value,
                // A component carries its category in the matched text, so typing a category finds
                // everything in it - the same rule the sidebar's own filter follows - while the row
                // still reads as the component's name. A category matches on its own name alone.
                searchText: entry.kind == "component" ? `${entry.value} ${entry.group}` : entry.value,
                onSelect: () => History.changeLocation(entry.url),
            }))}
            // `query` is threaded through to highlightMatch so a row still shows *why* it matched,
            // which drawing markup by hand is otherwise the easy way to lose - and the trailing
            // slot says which kind of destination the row is, since a category and a component look
            // otherwise identical.
            renderOption={(option, query) => {
                const entry = searchEntryByValue().get(option.value)
                return <span class="vtd-showcase-result">
                    <I i={entry?.icon ?? categoryIconKey(entry?.group ?? "")} class="vtd-showcase-result-icon"/>
                    <span class="vtd-showcase-result-name">{highlightMatch(option.value, query)}</span>
                    {/* The trailing note is highlighted too: searching a category matches these
                        rows on text that is not in their name, so marking only the name would show
                        a list of results with nothing in them explaining why they are there */}
                    <Text type="muted" class="vtd-showcase-result-group">{highlightMatch(entry?.detail ?? "", query)}</Text>
                </span>
            }}/>}</div>
        this.#sidebarSearchSlot = <div class="vtd-showcase-sidebar-search">{searchInput}</div>
        this.#searchInput = searchInput

        const content = getComponent<ContentArea>(<ContentArea/>)

        // One object, handed to both: the Sidebar writes `overlay` from its own breakpoint and the
        // Navbar reads it to know whether to draw the menu control, so the width lives in one place
        const nav = new RenderObject<SidebarNavState>({open: false, overlay: false})
        this.#nav = nav

        this.#sidebar = getComponent<Sidebar>(<Sidebar
            spa
            collapsible
            resizable
            nav={nav}
            class="vtd-showcase-sidebar"
            ariaLabel="Components by category"
            collapseLabel="Collapse or expand the sidebar"
            closeLabel="Close the navigation"
            header={this.#sidebarSearchSlot}
            // Keeps the header's height on the rail, so collapsing slides the icons sideways
            // rather than up. Clicking it expands the sidebar and puts the cursor in the box.
            collapsedHeader={<button
                type="button"
                class="vtd-showcase-sidebar-search-icon"
                aria-label="Search components"
                onClick={() => {
                    this.#sidebar.setCollapsed(false)
                    ;(searchInput.querySelector("input") as HTMLInputElement | null)?.focus()
                }}><I i={searchIconKey}/></button>}
            items={buildSidebarItems("", this.#openCategories)}
            defaultCollapsed={loadSidebarCollapsed()}
            onCollapsedChange={saveSidebarCollapsed}
            defaultWidth={loadSidebarWidth()}
            onWidthChange={saveSidebarWidth}
            onToggle={() => {
                // Only what the reader has open with *no* filter applied is worth remembering:
                // while a filter is active the sidebar holds categories it forced open for them
                if (!this.#filterText.trim()) {
                    this.#openCategories = new Set(this.#sidebar.getTree().getOpenKeys())
                }
            }}
            profile={{
                avatar: <Avatar initials="VD" size="1.9em"/>,
                name: "Velo Designer",
                detail: "design@velotype.dev",
                menuAriaLabel: "Account",
                menuItems: [
                    // No "Theme builder" here: it is a row of the sidebar itself now, and a second
                    // way in tucked inside the account menu is a place for the two to disagree
                    // about where that page lives.
                    //
                    // keepOpen + selected: the three are a radio group, so Menu moves the tick
                    // itself on a click and the menu stays put - switching theme is something a
                    // reader may well want to do twice, and closing on the click takes the choices
                    // away at the moment the page changes colour. The selected value is read from
                    // getColorSchemePreference, not getColorScheme: the latter has already resolved
                    // System to light or dark, so it would show Light ticked for a reader who chose
                    // to follow a browser that happens to prefer it.
                    {label: "Theme", children: themeMenuItems(scheme => this.#applyColorScheme(scheme))},
                    {label: "velodesign on JSR", dividerBefore: true, href: "https://jsr.io/@velotype/velodesign"},
                ],
            }}/>)

        this.#root = <div class="vtd-showcase-shell">
            {/* Navbar's own `brand` / `leading` / children slots, rather than a hand-built
                <header>: the brand sits far left, the tagline beside it via `leading`, and
                children are pushed to the right automatically. */}
            <Navbar
                class="vtd-showcase-header"
                sidebar={nav}
                menuLabel="Open the navigation"
                brand={<Link spa to="/" class="vtd-showcase-brand">velodesign</Link>}
                leading={<Text type="muted">Component showcase</Text>}>
                {this.#navbarSearchSlot}
            </Navbar>
            <div class="vtd-showcase-body">
                {this.#sidebar}
                <main class="vtd-showcase-main">{content}</main>
            </div>
        </div>
    }

    /**
     * Re-filters the list.
     *
     * `setItems` rather than a re-render: the search box lives in the sidebar's `header`, so
     * rebuilding the whole component would destroy the input the reader is typing into.
     */
    #setFilter(text: string) {
        this.#filterText = text
        // buildSidebarItems decides what is open through defaultOpen: every surviving category
        // while a filter is active, and otherwise whatever the reader had expanded
        this.#sidebar.setItems(buildSidebarItems(text, this.#openCategories))
    }

    /**
     * Publishes the header's real height for the sidebar to stick under.
     *
     * A ResizeObserver rather than a read on scroll: it reports only when the height actually
     * changes, so nothing measures layout on an event that fires at display rate. The value is
     * rounded down - a fractional offset leaves a hairline of page showing through the seam.
     */
    #headerObserver?: ResizeObserver

    /**
     * Closes the overlay nav when a click was a navigation, and leaves it open otherwise.
     *
     * ⚠️ The distinction is the whole point, and it is finer than "a click in the sidebar". A
     * group's row *is* a `NavLink` to that category's own page, while the chevron beside it only
     * expands the group - so closing on any click would shut the panel on someone who was opening a
     * category to look inside it, which is the one thing they were most likely doing. Only a click
     * that lands inside `.vtd-sidebar-link` is a destination.
     *
     * The panel stays open on the search box for the same reason: filtering is how a reader finds
     * the link they want, not the act of following one.
     */
    #closeNavOnNavigation = (event: MouseEvent) => {
        if (!this.#sidebar.isOpen()) {
            return
        }
        const target = event.target instanceof Element ? event.target : null
        if (target?.closest(".vtd-sidebar-link")) {
            this.#sidebar.close()
        }
    }

    /**
     * Puts the search box in whichever slot the current width calls for.
     *
     * Guarded on the last placement: the nav object reports every change to open/closed as well,
     * and moving a focused input for a change that was not about width would drop the cursor out
     * of it mid-keystroke.
     */
    #placeSearch = () => {
        const overlay = this.#nav.get().overlay
        if (overlay === this.#searchInOverlay) {
            return
        }
        this.#searchInOverlay = overlay
        // The sidebar's header is only worth its padding and its rule while it holds a box
        this.#root.classList.toggle("vtd-showcase-search-in-navbar", !overlay)
        // Carry the query across rather than stranding it in the box that just went away, and put
        // the sidebar back to its full list whenever its own filter is no longer the one in use
        const from = (overlay ? this.#navbarSearchSlot : this.#sidebarSearchSlot).querySelector("input")
        const to = (overlay ? this.#sidebarSearchSlot : this.#navbarSearchSlot).querySelector("input")
        if (from && to) {
            to.value = from.value
            from.value = ""
        }
        this.#setFilter(overlay ? (to?.value ?? "") : "")
    }

    override mount() {
        // Capture, so the panel closes even though `NavLink`'s own handler navigates on the same
        // click - and on the sidebar's root rather than the document, so a click anywhere else on
        // the page is not this component's business
        this.#sidebar.render().addEventListener("click", this.#closeNavOnNavigation)
        this.#nav.registerOnChangeListener(this.#placeSearch, {hasVtKey: this})
        this.#placeSearch()

        const header = this.#root.querySelector(".vtd-showcase-header") as HTMLElement | null
        if (!header) {
            return
        }
        this.#headerObserver = new ResizeObserver(() => {
            this.#root.style.setProperty("--vtd-showcase-header-height", `${Math.floor(header.getBoundingClientRect().height)}px`)
        })
        this.#headerObserver.observe(header)
    }

    override unmount() {
        this.#sidebar.render().removeEventListener("click", this.#closeNavOnNavigation)
        this.#headerObserver?.disconnect()
    }

    override render(): HTMLDivElement {
        return this.#root
    }
}
