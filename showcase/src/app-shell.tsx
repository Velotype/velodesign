import { Component, getComponent, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"

import { Button, ColorScheme, Empty, History, Link, NavLink, Navbar, Text, TextBox } from "../../src/index.ts"
import { docBySlug, groupByGroupSlug, groupedDocs } from "./data/docs.tsx"
import { HomePage } from "./pages/home.tsx"
import { ComponentPage } from "./pages/component-page.tsx"
import { CategoryPage, categoryPageUrl } from "./pages/category-page.tsx"
import { NotFoundPage } from "./pages/not-found.tsx"
import { ThemeBuilderPage } from "./pages/theme-builder.tsx"

/**
 * The grouped, searchable sidebar list of every documented component.
 *
 * Every entry is a `NavLink`, which tracks the current location itself - it re-evaluates
 * `location.pathname` on `popstate`/`locationchange` and toggles its own `activeClass`. This
 * component used to do that by hand: a `popstate`/`locationchange` listener pair, a retained
 * reference to its own root element, and a `querySelectorAll` that toggled the active class on
 * every link after each navigation. All of it existed because `refresh()` would have reset the
 * sidebar's scroll position and lost the user's place in a long list - and all of it is what
 * `NavLink` is for.
 *
 * `setFilter` still uses `refresh()`: an actual search edit changes which items exist, so the
 * list genuinely has to be rebuilt, and losing scroll position there is both acceptable and much
 * rarer. It stays scoped to this subtree and never touches the search `TextBox` in `AppShell`, so
 * typing never loses focus.
 */
class SidebarList extends Component<EmptyAttrs> {
    #filterText = ""

    setFilter(text: string) {
        this.#filterText = text
        this.refresh()
    }

    override render(): HTMLDivElement {
        const filterLower = this.#filterText.trim().toLowerCase()
        const buckets = groupedDocs()
            .map(bucket => ({group: bucket.group, docs: bucket.docs.filter(doc => doc.name.toLowerCase().includes(filterLower))}))
            .filter(bucket => bucket.docs.length > 0)

        return <div class="vtd-showcase-sidebar-list">
            {buckets.length == 0
                ? <Empty description={`No components match "${this.#filterText}"`}/>
                : null}
            {buckets.map(bucket => <div class="vtd-showcase-sidebar-group">
                <Link spa to={categoryPageUrl(bucket.group)} class="vtd-showcase-sidebar-group-label">{bucket.group}</Link>
                {bucket.docs.map(doc => <NavLink
                    spa
                    to={`/components/${doc.slug}`}
                    activeClass="vtd-showcase-sidebar-item-active"
                    class="vtd-showcase-sidebar-item">{doc.name}</NavLink>)}
            </div>)}
        </div>
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
border-inline-end:1px solid var(--background-4);
display:flex;
flex-direction:column;
position:sticky;
top:53px;
align-self:flex-start;
height:calc(100vh - 53px);
}
.vtd-showcase-sidebar-search{padding:0.75em;border-block-end:1px solid var(--background-4);}
.vtd-showcase-sidebar-search .vtd-textbox{width:100%;margin-inline-start:0;box-sizing:border-box;}
.vtd-showcase-sidebar-list{overflow-y:auto;flex-grow:1;padding-block-end:1em;}
.vtd-showcase-sidebar-group-label{
display:block;
padding:0.9em 0.9em 0.3em 0.9em;
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-9);
text-decoration:none;
}
.vtd-showcase-sidebar-group-label:hover{color:var(--primary-8);}
.vtd-showcase-sidebar-item{
display:block;
padding:0.4em 0.9em;
margin:0 0.5em;
border-radius:0.25rem;
color:inherit;
text-decoration:none;
font-size:0.95em;
}
.vtd-showcase-sidebar-item:hover{background-color:var(--background-2);}
.vtd-showcase-sidebar-item-active{background-color:var(--primary-2);font-weight:bold;}
.vtd-showcase-main{flex-grow:1;min-width:0;}
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
                <aside class="vtd-showcase-sidebar-wrapper">
                    <div class="vtd-showcase-sidebar-search">{searchInput}</div>
                    {this.#sidebarList}
                </aside>
                <main class="vtd-showcase-main">{content}</main>
            </div>
        </div>
    }

    override render(): HTMLDivElement {
        return this.#root
    }
}
