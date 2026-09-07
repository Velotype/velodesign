import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { RenderableElements, IdAttr, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single entry in a `<Command/>` palette
 */
export type CommandItemType = {
    /** Unique key identifying this item */
    key: string
    /** Displayed label for this item */
    label: RenderableElements
    /** Text matched against the search query - always provide this when `label` isn't a
     *  plain string, since `label` itself (being `RenderableElements`) can't be searched */
    searchText?: string
    /** Called when this item is picked (by click or Enter), just before the palette closes */
    onSelect: () => void
}

/**
 * Attrs type for `<Command/>` Component
 */
export type CommandAttrsType = {
    /** The full set of available items; filtered client-side against the search query */
    items: CommandItemType[]
    /** Placeholder text for the search input */
    placeholder?: string
} & IdAttr & StylePassthroughAttrs

let areCommandStylesMounted = false

/**
 * A searchable command palette overlay: a text input filters a list of items, with
 * Up/Down/Enter keyboard navigation. Built on a native `<dialog/>` (like `Modal`), so
 * Escape-to-close and the backdrop come from the browser for free.
 *
 * Open it with `getComponent<Command>(<commandElement/>).showModal()` (per the
 * `<ClassComponent/>` JSX gotcha - the JSX tag itself evaluates to the rendered `<dialog/>`,
 * not the Component instance) or, more simply, keep a reference to the instance via
 * `getComponent` right after constructing it.
 */
export class Command extends Component<CommandAttrsType> {
    #attrs: CommandAttrsType
    #dialog: HTMLDialogElement
    #input: HTMLInputElement
    #list: HTMLUListElement
    #query = ""
    #highlightedIndex = 0

    /** Close the palette */
    close() {
        this.#dialog.close()
    }
    /** Reset search/selection state and show the palette */
    showModal() {
        this.#query = ""
        this.#highlightedIndex = 0
        this.#input.value = ""
        this.#dialog.showModal()
        this.#renderList()
        globalThis.setTimeout(() => this.#input.focus(), 0)
    }

    /** Items matching the current search query (all items if the query is empty) */
    #filteredItems(): CommandItemType[] {
        const query = this.#query.trim().toLowerCase()
        if (!query) {
            return this.#attrs.items
        }
        return this.#attrs.items.filter(item => (item.searchText || "").toLowerCase().includes(query))
    }

    /** Picks the currently-highlighted item, if any, and closes the palette */
    #selectHighlighted() {
        const items = this.#filteredItems()
        const item = items[this.#highlightedIndex]
        if (item) {
            item.onSelect()
            this.close()
        }
    }

    /** Rebuilds the visible item list to match the current query/highlight, without a full `refresh()` */
    #renderList() {
        const items = this.#filteredItems()
        if (this.#highlightedIndex >= items.length) {
            this.#highlightedIndex = Math.max(0, items.length - 1)
        }
        if (items.length == 0) {
            this.#list.replaceChildren(<li class="vtd-command-empty">No results</li>)
            return
        }
        this.#list.replaceChildren(...items.map((item, index) => <li
            class={`vtd-command-item${index == this.#highlightedIndex ? " vtd-command-item-highlighted" : ""}`}
            role="option"
            aria-selected={index == this.#highlightedIndex}
            onClick={() => { this.#highlightedIndex = index; this.#selectHighlighted() }}>{item.label}</li>))
    }

    /** Create a new `<Command/>` Component */
    constructor(attrs: CommandAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        if (!areCommandStylesMounted) {
            areCommandStylesMounted = true
            setStylesheet(`
.vtd-command{margin:10vh auto auto auto;padding:0;border:none;width:min(32em,90vw);border-radius:0.5rem;overflow:hidden;}
.vtd-command::backdrop{background:rgba(75,75,75,0.6);backdrop-filter:blur(2px);}
.vtd-command-input{
width:100%;
padding:0.9em 1em;
border:none;
border-block-end:1px solid var(--background-4);
background-color:var(--background-1);
color:var(--text);
font:inherit;
}
.vtd-command-input:focus-visible{outline:none;}
.vtd-command-list{list-style:none;margin:0;padding:0.4em;max-height:16em;overflow:auto;}
.vtd-command-item{padding:0.6em 0.75em;border-radius:0.25rem;cursor:pointer;}
.vtd-command-item-highlighted{background-color:var(--primary-3);}
.vtd-command-empty{padding:1.5em;text-align:center;opacity:0.6;}
`, "vtd/Command")
        }

        this.#input = <input
            type="text"
            class="vtd-command-input"
            placeholder={attrs.placeholder}
            onInput={(event: Event) => {
                if (event.target instanceof HTMLInputElement) {
                    this.#query = event.target.value
                    this.#highlightedIndex = 0
                    this.#renderList()
                }
            }}
            onKeyDown={(event: KeyboardEvent) => {
                const items = this.#filteredItems()
                if (event.key == "ArrowDown") {
                    event.preventDefault()
                    this.#highlightedIndex = Math.min(this.#highlightedIndex + 1, items.length - 1)
                    this.#renderList()
                } else if (event.key == "ArrowUp") {
                    event.preventDefault()
                    this.#highlightedIndex = Math.max(this.#highlightedIndex - 1, 0)
                    this.#renderList()
                } else if (event.key == "Enter") {
                    event.preventDefault()
                    this.#selectHighlighted()
                }
            }}/>
        this.#list = <ul class="vtd-command-list" role="listbox"/>

        this.#dialog = <dialog class="vtd-command" closedby="any">
            {this.#input}
            {this.#list}
        </dialog>

        passthroughAttrsToElement<HTMLDialogElement>(this.#dialog, attrs)
    }

    /** Render this Component */
    override render(): HTMLDialogElement {
        return this.#dialog
    }
}
