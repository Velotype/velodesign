import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single Tab within a `<Tabs/>` Component
 */
export type TabType = {
    /** Unique key identifying this tab */
    key: string
    /** Content shown in the tab's clickable label */
    label: RenderableElements
    /** Content shown when this tab is active */
    content: RenderableElements
}

/**
 * Attrs type for `<Tabs/>` Component
 */
export type TabsAttrsType = {
    /** The set of tabs to render */
    tabs: TabType[]
    /** Key of the tab that starts active (defaults to the first tab) */
    initialKey?: string
} & IdAttr & StylePassthroughAttrs

let areTabsStylesMounted = false

/**
 * A set of labeled panels where only one panel is shown at a time.
 *
 * Every panel stays mounted in the DOM permanently (hidden via a CSS class rather than only
 * the active one being present, or being added/removed) - switching tabs just toggles classes
 * directly, it never calls `this.refresh()`. `content` is consumer-supplied and can be
 * arbitrary components with their own state; a `refresh()`-based rebuild on every tab switch
 * would tear all of that down and reconstruct it from scratch each time, losing whatever state
 * an inactive tab's content held. Panel visibility is toggled with a class rather than the
 * native `hidden` attribute - verified directly that a panel starting out `hidden` never
 * actually renders its (consumer-supplied) content at all, even after `hidden` is later
 * removed, so `hidden` can't be used here the way `Popover`/`SelectMenu`/`DataTable`'s column
 * menu already use a CSS-class toggle for exactly this kind of "stays mounted, becomes visible
 * later" case.
 */
export class Tabs extends Component<TabsAttrsType> {
    /** Key of the currently active tab */
    #activeKey: string
    /** Tab buttons, keyed by tab key */
    #tabButtons: Record<string, HTMLButtonElement> = {}
    /** Panels, keyed by tab key */
    #panels: Record<string, HTMLDivElement> = {}
    #root: HTMLDivElement

    /** Switch to `key`, toggling classes directly on the already-built elements */
    #activate(key: string) {
        if (key == this.#activeKey) {
            return
        }
        this.#tabButtons[this.#activeKey]?.classList.remove("vtd-tabs-tab-active")
        this.#tabButtons[this.#activeKey]?.setAttribute("aria-selected", "false")
        this.#tabButtons[this.#activeKey]?.setAttribute("tabindex", "-1")
        this.#panels[this.#activeKey]?.classList.remove("vtd-tabs-panel-active")
        this.#activeKey = key
        this.#tabButtons[key]?.classList.add("vtd-tabs-tab-active")
        this.#tabButtons[key]?.setAttribute("aria-selected", "true")
        this.#tabButtons[key]?.setAttribute("tabindex", "0")
        this.#panels[key]?.classList.add("vtd-tabs-panel-active")
    }

    /** Moves focus to the tab at `key` (as opposed to `#activate`, which also switches the
     * panel) - used by arrow-key navigation, which per the ARIA APG Tabs pattern activates the
     * newly-focused tab immediately (the "automatic activation" model), so this always calls
     * through to `#activate` too, but keeping it separate documents the two distinct triggers */
    #focusAndActivate(key: string) {
        this.#activate(key)
        this.#tabButtons[key]?.focus()
    }

    /** Implements the ARIA APG Tabs keyboard pattern: Left/Right moves between tabs
     * (wrapping), Home/End jumps to the first/last - the browser's own Tab key still moves
     * focus in and out of the whole tablist as a single stop, via the roving `tabindex`
     * `#activate` maintains above */
    #handleKeyDown = (event: KeyboardEvent) => {
        const keys = Object.keys(this.#tabButtons)
        const currentIndex = keys.indexOf(this.#activeKey)
        if (event.key == "ArrowLeft") {
            event.preventDefault()
            this.#focusAndActivate(keys[(currentIndex - 1 + keys.length) % keys.length])
        } else if (event.key == "ArrowRight") {
            event.preventDefault()
            this.#focusAndActivate(keys[(currentIndex + 1) % keys.length])
        } else if (event.key == "Home") {
            event.preventDefault()
            this.#focusAndActivate(keys[0])
        } else if (event.key == "End") {
            event.preventDefault()
            this.#focusAndActivate(keys[keys.length - 1])
        }
    }

    /** Create a new `<Tabs/>` Component */
    constructor(attrs: TabsAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#activeKey = attrs.initialKey || attrs.tabs[0]?.key
        if (!areTabsStylesMounted) {
            areTabsStylesMounted = true
            setStylesheet(`
.vtd-tabs{
width:100%;
box-sizing:border-box;
}
.vtd-tabs-list{
display:flex;
gap:0.25em;
border-block-end:1px solid var(--background-4);
}
.vtd-tabs-tab{
cursor:pointer;
background:transparent;
border:none;
border-block-end:2px solid transparent;
color:inherit;
font:inherit;
padding:0.5em 1em;
margin-block-end:-1px;
}
.vtd-tabs-tab:hover{background-color:var(--background-1);}
.vtd-tabs-tab-active{
border-block-end:2px solid var(--primary);
/*
 * A real font-weight:bold here would widen the label text and shift every tab after it -
 * text-shadow fakes a bolder stroke by drawing the glyphs twice, offset by under a pixel,
 * without touching text metrics/layout at all.
 */
text-shadow:-0.4px 0 currentColor, 0.4px 0 currentColor;
}
.vtd-tabs-panel{
display:none;
padding:1em 0;
}
.vtd-tabs-panel-active{display:block;}
`, "vtd/Tabs")
        }

        this.#root = <div class="vtd-tabs">
            <div class="vtd-tabs-list" role="tablist" onKeyDown={this.#handleKeyDown}>
                {attrs.tabs.map(tab => {
                    const button: HTMLButtonElement = <button
                        type="button"
                        role="tab"
                        aria-selected={tab.key == this.#activeKey}
                        tabindex={tab.key == this.#activeKey ? 0 : -1}
                        class={`vtd-tabs-tab${tab.key == this.#activeKey ? " vtd-tabs-tab-active" : ""}`}
                        onClick={() => this.#activate(tab.key)}>{tab.label}</button>
                    this.#tabButtons[tab.key] = button
                    return button
                })}
            </div>
            <div class="vtd-tabs-panels">
                {attrs.tabs.map(tab => {
                    const panel: HTMLDivElement = <div class={`vtd-tabs-panel${tab.key == this.#activeKey ? " vtd-tabs-panel-active" : ""}`} role="tabpanel">{tab.content}</div>
                    this.#panels[tab.key] = panel
                    return panel
                })}
            </div>
        </div>

        passthroughAttrsToElement<HTMLDivElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
