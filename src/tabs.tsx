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
 * A set of labeled panels where only one panel is shown at a time
 */
export class Tabs extends Component<TabsAttrsType> {
    /** Key of the currently active tab */
    #activeKey: string

    /** Create a new `<Tabs/>` Component */
    constructor(attrs: TabsAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#activeKey = attrs.initialKey || attrs.tabs[0]?.key
        if (!areTabsStylesMounted) {
            areTabsStylesMounted = true
            setStylesheet(`
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
font-weight:bold;
}
.vtd-tabs-panel{
padding:1em 0;
}
`, "vtd/Tabs")
        }
    }

    /** Render this Component */
    override render(attrs: TabsAttrsType): RenderableElements {
        const activeTab = attrs.tabs.find(tab => tab.key == this.#activeKey)
        return passthroughAttrsToElement(<div class="vtd-tabs">
            <div class="vtd-tabs-list" role="tablist">
                {attrs.tabs.map(tab => <button
                    type="button"
                    role="tab"
                    aria-selected={tab.key == this.#activeKey}
                    class={`vtd-tabs-tab${tab.key == this.#activeKey ? " vtd-tabs-tab-active" : ""}`}
                    onClick={() => {
                        if (tab.key != this.#activeKey) {
                            this.#activeKey = tab.key
                            this.refresh()
                        }
                    }}>{tab.label}</button>)}
            </div>
            <div class="vtd-tabs-panel" role="tabpanel">{activeTab?.content}</div>
        </div>, attrs)
    }
}
