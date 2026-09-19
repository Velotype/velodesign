import { Component, getComponent, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"

import { Avatar, Button, ColorScheme, highlightMatch, I, Link, Navbar, searchHighlightCss, Sidebar, Text, TextBox } from "../../src/index.ts"
import { categoryIconKey } from "./data/category-icons.ts"
import type { SidebarItemType } from "../../src/index.ts"
import { docBySlug, groupByGroupSlug, groupedDocs } from "./data/docs.tsx"
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
        .map(bucket => ({group: bucket.group, docs: bucket.docs.filter(doc => doc.name.toLowerCase().includes(filterLower))}))
        .filter(bucket => bucket.docs.length > 0)
        .map(bucket => ({
            key: bucket.group,
            // The category name links to its own page and also toggles the group: the click lands
            // on the link, so Tree's summary handler sees defaultPrevented and leaves the toggle
            // to the chevron and the rest of the row.
            label: <Link spa to={categoryPageUrl(bucket.group)} class="vtd-showcase-sidebar-group-label">{bucket.group}</Link>,
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

let areShellStylesMounted = false

/**
 * The persistent page shell: header (brand, dark-mode toggle) and a body split between the
 * searchable sidebar and the routed content area. Built once here (like `Modal`/`ExplorerApp`)
 * and never refreshed as a whole - `SidebarList` and `ContentArea` each manage their own
 * targeted re-renders.
 */
export class AppShell extends Component<EmptyAttrs> {
    #root: HTMLDivElement
    #sidebar: Sidebar
    /** What the reader has expanded, kept across the item rebuilds a search edit causes */
    #openCategories = new Set<string>()
    #filterText = ""

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
top:53px;
/* The chrome layer - see the note on .vtd-showcase-main. Same value as the header, because they
   are the same layer and never overlap each other */
z-index:1;
align-self:flex-start;
height:calc(100vh - 53px);
}
.vtd-showcase-sidebar-search .vtd-text-box{width:100%;margin-inline-start:0;box-sizing:border-box;}
.vtd-showcase-sidebar-group-label{
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-9);
text-decoration:none;
}
.vtd-showcase-sidebar-group-label:hover{color:var(--primary-8);}
.vtd-showcase-sidebar-count{font-size:0.75em;}
.vtd-showcase-main{flex-grow:1;min-width:0;isolation:isolate;}
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
                if (event.target instanceof HTMLInputElement) { this.#setFilter(event.target.value) }
            }}/>

        const content = getComponent<ContentArea>(<ContentArea/>)

        this.#sidebar = getComponent<Sidebar>(<Sidebar
            spa
            collapsible
            resizable
            class="vtd-showcase-sidebar"
            ariaLabel="Components by category"
            collapseLabel="Collapse or expand the sidebar"
            header={<div class="vtd-showcase-sidebar-search">{searchInput}</div>}
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
                    {label: "Theme builder", href: "/theme", spa: true},
                    {label: "Appearance", children: [
                        {label: "Light", onClick: () => ColorScheme.setColorScheme("light")},
                        {label: "Dark", onClick: () => ColorScheme.setColorScheme("dark")},
                    ]},
                    {label: "velodesign on JSR", dividerBefore: true, href: "https://jsr.io/@velotype/velodesign"},
                ],
            }}/>)

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

    override render(): HTMLDivElement {
        return this.#root
    }
}
