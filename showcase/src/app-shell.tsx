import { Component, getComponent, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"

import { Button, ColorScheme, History, TextBox } from "../../src/index.ts"
import { docBySlug, groupedDocs } from "./data/docs.ts"
import { HomePage } from "./pages/home.tsx"
import { ComponentPage } from "./pages/component-page.tsx"
import { NotFoundPage } from "./pages/not-found.tsx"

/**
 * The grouped, searchable sidebar list of every documented component. `setFilter` is the only
 * thing that rebuilds it on a search edit, and it also listens for navigation itself (to
 * refresh its own active-item highlight) - both keep the change scoped to this subtree, never
 * touching the search `TextBox` that lives in `AppShell`, so typing never loses focus (same
 * split `AppShell`/`SidebarList` this pattern comes from in the Explorer).
 */
class SidebarList extends Component<EmptyAttrs> {
    #filterText = ""

    #handleLocationChange = () => { this.refresh() }

    override mount() {
        globalThis.addEventListener("popstate", this.#handleLocationChange)
        globalThis.addEventListener("locationchange", this.#handleLocationChange)
    }
    override unmount() {
        globalThis.removeEventListener("popstate", this.#handleLocationChange)
        globalThis.removeEventListener("locationchange", this.#handleLocationChange)
    }

    setFilter(text: string) {
        this.#filterText = text
        this.refresh()
    }

    override render(): HTMLDivElement {
        const pathname = globalThis.location.pathname
        const activeSlug = pathname.startsWith("/components/") ? pathname.slice("/components/".length).replace(/\/$/, "") : ""
        const filterLower = this.#filterText.trim().toLowerCase()
        const buckets = groupedDocs()
            .map(bucket => ({group: bucket.group, docs: bucket.docs.filter(doc => doc.name.toLowerCase().includes(filterLower))}))
            .filter(bucket => bucket.docs.length > 0)

        return <div class="vtd-showcase-sidebar-list">
            {buckets.length == 0 ? <div class="vtd-showcase-sidebar-empty">No components match "{this.#filterText}"</div> : null}
            {buckets.map(bucket => <div class="vtd-showcase-sidebar-group">
                <div class="vtd-showcase-sidebar-group-label">{bucket.group}</div>
                {bucket.docs.map(doc => <a
                    href={`/components/${doc.slug}`}
                    class={`vtd-showcase-sidebar-item${doc.slug == activeSlug ? " vtd-showcase-sidebar-item-active" : ""}`}
                    onClick={(event: Event) => {
                        event.preventDefault()
                        History.changeLocation(`/components/${doc.slug}`)
                    }}>{doc.name}</a>)}
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
        const match = pathname.match(/^\/components\/([a-z0-9-]+)\/?$/)
        if (match) {
            const doc = docBySlug(match[1])
            if (doc) {
                return <ComponentPage doc={doc}/>
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
.vtd-showcase-header{
display:flex;
align-items:center;
gap:1em;
padding:0.75em 1.25em;
border-block-end:1px solid var(--background-4);
position:sticky;
top:0;
background-color:var(--background);
z-index:2;
}
.vtd-showcase-brand{
font-size:1.15em;
font-weight:bold;
color:inherit;
text-decoration:none;
}
.vtd-showcase-tagline{color:var(--background-9);font-size:0.9em;margin-inline-end:auto;}
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
padding:0.9em 0.9em 0.3em 0.9em;
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-9);
}
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
.vtd-showcase-sidebar-empty{padding:0.9em;color:var(--background-9);}
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
            <header class="vtd-showcase-header">
                <a class="vtd-showcase-brand" href="/" onClick={(event: Event) => { event.preventDefault(); History.changeLocation("/") }}>velodesign</a>
                <span class="vtd-showcase-tagline">Component showcase</span>
                {themeToggle}
            </header>
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
