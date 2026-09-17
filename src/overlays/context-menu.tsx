import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single entry in a `<ContextMenu/>`
 */
export type ContextMenuItemType = {
    /** Displayed label for this entry */
    label: RenderableElements
    /** Called when this entry is clicked */
    onClick?: () => void
    /** Is this entry disabled? */
    disabled?: boolean
}

/**
 * Attrs type for `<ContextMenu/>` Component
 */
export type ContextMenuAttrsType = {
    /** The set of entries to show */
    items: ContextMenuItemType[]
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areContextMenuStylesMounted = false

/**
 * Wraps `children` so that right-clicking anywhere inside it (or pressing the keyboard
 * "context menu"/Menu key, or Shift+F10, which dispatch the same native `contextmenu` event)
 * opens a themed menu at the cursor position, instead of the browser's native context menu.
 *
 * Follows the ARIA APG Menu pattern for keyboard support: opening moves focus to the first
 * enabled item, Up/Down/Home/End move between items (skipping disabled ones, wrapping at the
 * ends), and Escape (or Tab) closes the menu and returns focus to wherever it was before the
 * menu opened.
 */
export class ContextMenu extends Component<ContextMenuAttrsType> {
    /** The wrapper around `children` that listens for `contextmenu` */
    #wrapper: HTMLDivElement
    /** The positioned menu element */
    #menu: HTMLUListElement
    /** The enabled item buttons, in order - what arrow-key/Home/End navigation moves between */
    #enabledItemEls: HTMLButtonElement[] = []
    /** Whatever had focus just before the menu opened, so closing can restore it */
    #previouslyFocusedEl: HTMLElement | null = null

    /** Close the menu, optionally restoring focus to whatever had it before the menu opened */
    #close = (restoreFocus = false) => {
        this.#menu.classList.remove("vtd-context-menu-open")
        if (restoreFocus) {
            this.#previouslyFocusedEl?.focus()
        }
    }

    /** Open the menu at the cursor position, relative to `#wrapper`, and move focus to the first enabled item */
    #handleContextMenu = (event: MouseEvent) => {
        event.preventDefault()
        this.#previouslyFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
        const wrapperRect = this.#wrapper.getBoundingClientRect()
        this.#menu.style.left = `${event.clientX - wrapperRect.left}px`
        this.#menu.style.top = `${event.clientY - wrapperRect.top}px`
        this.#menu.classList.add("vtd-context-menu-open")
        this.#enabledItemEls[0]?.focus()
    }

    /** Implements the ARIA APG Menu keyboard pattern for moving between/activating items */
    #handleKeyDown = (event: KeyboardEvent) => {
        const currentIndex = this.#enabledItemEls.indexOf(document.activeElement as HTMLButtonElement)
        if (event.key == "ArrowDown") {
            event.preventDefault()
            this.#enabledItemEls[(currentIndex + 1) % this.#enabledItemEls.length]?.focus()
        } else if (event.key == "ArrowUp") {
            event.preventDefault()
            this.#enabledItemEls[(currentIndex - 1 + this.#enabledItemEls.length) % this.#enabledItemEls.length]?.focus()
        } else if (event.key == "Home") {
            event.preventDefault()
            this.#enabledItemEls[0]?.focus()
        } else if (event.key == "End") {
            event.preventDefault()
            this.#enabledItemEls[this.#enabledItemEls.length - 1]?.focus()
        } else if (event.key == "Escape") {
            event.preventDefault()
            this.#close(true)
        } else if (event.key == "Tab") {
            this.#close(false)
        }
    }

    /** Close the menu if it's open and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#menu.classList.contains("vtd-context-menu-open")) {
            return
        }
        if (event.target instanceof Node && this.#menu.contains(event.target)) {
            return
        }
        this.#close()
    }

    /** Mount this Component */
    override mount() {
        this.#wrapper.addEventListener("contextmenu", this.#handleContextMenu)
        document.addEventListener("click", this.#handleDocumentClick)
    }

    /** Unmount this Component */
    override unmount() {
        this.#wrapper.removeEventListener("contextmenu", this.#handleContextMenu)
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    /** Create a new `<ContextMenu/>` Component */
    constructor(attrs: ContextMenuAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areContextMenuStylesMounted) {
            areContextMenuStylesMounted = true
            setStylesheet(`
.vtd-context-menu-wrapper{position:relative;}
.vtd-context-menu{
position:absolute;
z-index:1000;
display:none;
min-width:10em;
margin:0;
padding:0.25em;
list-style:none;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.2);
}
.vtd-context-menu-open{display:block;}
.vtd-context-menu-item{
display:block;
width:100%;
text-align:start;
padding:0.4em 0.75em;
border-radius:0.25rem;
color:inherit;
background:transparent;
border:none;
font:inherit;
cursor:pointer;
}
.vtd-context-menu-item:hover{background-color:var(--background-2);}
.vtd-context-menu-item:focus-visible{background-color:var(--background-2);outline:none;}
.vtd-context-menu-item-disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;}
`, "vtd/ContextMenu")
        }

        this.#menu = <ul class="vtd-context-menu" role="menu" onKeyDown={this.#handleKeyDown}>
            {attrs.items.map(item => <li role="none">
                <button
                    type="button"
                    role="menuitem"
                    tabindex={-1}
                    disabled={item.disabled}
                    class={`vtd-context-menu-item${item.disabled ? " vtd-context-menu-item-disabled" : ""}`}
                    onClick={() => {
                        item.onClick?.()
                        this.#close(true)
                    }}>{item.label}</button>
            </li>)}
        </ul>

        this.#enabledItemEls = Array.from(this.#menu.querySelectorAll<HTMLButtonElement>(".vtd-context-menu-item:not(:disabled)"))

        this.#wrapper = <div class="vtd-context-menu-wrapper">
            {children}
            {this.#menu}
        </div>

        passthroughAttrsToElement<HTMLDivElement>(this.#wrapper, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#wrapper
    }
}
