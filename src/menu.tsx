import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single entry in a `<Menu/>`
 */
export type MenuItemType = {
    /** Displayed label for this entry */
    label: RenderableElements
    /** If set, this entry renders as a link to this URL (for a navigational submenu) */
    href?: string
    /** Called when this entry is clicked (for an actions menu) */
    onClick?: () => void
    /** Is this entry disabled? */
    disabled?: boolean
}

/**
 * Attrs type for `<Menu/>` Component
 */
export type MenuAttrsType = {
    /** Content that opens the menu when clicked */
    trigger: RenderableElements
    /** The set of entries to show */
    items: MenuItemType[]
    /** Closes the menu when the user clicks anywhere outside of it (default: `true`) */
    closeOnOutsideClick?: boolean
} & IdAttr & StylePassthroughAttrs

let areMenuStylesMounted = false

/**
 * A dropdown menu, for either a submenu of navigational links or a small actions menu.
 *
 * Built on native `<details>`/`<summary>` - the browser handles opening/closing and keyboard
 * toggling for free. Closes when an item is picked, when the trigger is toggled again, or
 * when the user clicks anywhere outside the menu.
 */
export class Menu extends Component<MenuAttrsType> {
    /** The underlying `<details/>` element */
    #detailsElement: HTMLDetailsElement
    /** The trigger, so `Escape` can return focus to it (native `<details>` gives no such
     * behavior on its own - closing it via script leaves focus wherever it was, which is
     * inside the now-hidden menu if the user was navigating it by keyboard) */
    #summaryElement: HTMLElement
    /** The menu item links, in order - what arrow-key/Home/End navigation moves between */
    #itemEls: HTMLAnchorElement[] = []
    /** Attrs captured at construction, read by `#handleDocumentClick` (see the `Command` doc note on why this can't just close over the constructor's `attrs` parameter) */
    #attrs: MenuAttrsType

    #closeMenu = (restoreFocus = false) => {
        this.#detailsElement.removeAttribute("open")
        if (restoreFocus) {
            this.#summaryElement.focus()
        }
    }

    /** Close the menu if it's open, outside-click closing is enabled, and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (this.#attrs.closeOnOutsideClick === false) {
            return
        }
        if (!this.#detailsElement.open) {
            return
        }
        if (event.target instanceof Node && this.#detailsElement.contains(event.target)) {
            return
        }
        this.#closeMenu()
    }

    /** Implements the ARIA APG Menu keyboard pattern once the menu is open: Up/Down/Home/End
     * move between items, Escape closes and returns focus to the trigger - none of which a
     * native `<details>` provides on its own (only the summary's own open/close toggle is free) */
    #handleKeyDown = (event: KeyboardEvent) => {
        if (event.key == "Escape") {
            if (this.#detailsElement.open) {
                event.preventDefault()
                this.#closeMenu(true)
            }
            return
        }
        if (!this.#detailsElement.open || this.#itemEls.length == 0) {
            return
        }
        const currentIndex = this.#itemEls.indexOf(document.activeElement as HTMLAnchorElement)
        if (event.key == "ArrowDown") {
            event.preventDefault()
            this.#itemEls[(currentIndex + 1) % this.#itemEls.length]?.focus()
        } else if (event.key == "ArrowUp") {
            event.preventDefault()
            this.#itemEls[(currentIndex - 1 + this.#itemEls.length) % this.#itemEls.length]?.focus()
        } else if (event.key == "Home") {
            event.preventDefault()
            this.#itemEls[0]?.focus()
        } else if (event.key == "End") {
            event.preventDefault()
            this.#itemEls[this.#itemEls.length - 1]?.focus()
        }
    }

    /** Mount this Component */
    override mount() {
        document.addEventListener("click", this.#handleDocumentClick)
    }

    /** Unmount this Component */
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    /** Create a new `<Menu/>` Component */
    constructor(attrs: MenuAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        if (!areMenuStylesMounted) {
            areMenuStylesMounted = true
            setStylesheet(`
.vtd-menu{
position:relative;
display:inline-block;
}
.vtd-menu-trigger{
cursor:pointer;
display:inline-block;
list-style:none;
user-select:none;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
}
.vtd-menu-trigger::-webkit-details-marker{display:none;}
.vtd-menu-trigger::marker{display:none;content:"";}
.vtd-menu-trigger:hover{background-color:var(--background-1);}
.vtd-menu-list{
position:absolute;
top:100%;
left:0;
z-index:1000;
min-width:10em;
margin-block-start:0.25em;
padding:0.25em;
list-style:none;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.15);
}
.vtd-menu-item{
display:block;
padding:0.4em 0.75em;
border-radius:0.25rem;
color:inherit;
text-decoration:none;
}
.vtd-menu-item:hover{background-color:var(--background-2);}
.vtd-menu-item:focus-visible{background-color:var(--background-2);outline:none;}
.vtd-menu-item-disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;}
`, "vtd/Menu")
        }

        this.#summaryElement = <summary class="vtd-menu-trigger">{attrs.trigger}</summary>

        this.#itemEls = attrs.items.map(item => <a
            role="menuitem"
            href={item.href || "#"}
            aria-disabled={item.disabled}
            class={`vtd-menu-item${item.disabled ? " vtd-menu-item-disabled" : ""}`}
            onClick={(event: Event) => {
                if (item.disabled) {
                    event.preventDefault()
                    return
                }
                if (!item.href) {
                    event.preventDefault()
                }
                item.onClick?.()
                this.#closeMenu()
            }}>{item.label}</a>)

        this.#detailsElement = <details class="vtd-menu" onKeyDown={this.#handleKeyDown}>
            {this.#summaryElement}
            <ul class="vtd-menu-list" role="menu">
                {this.#itemEls.map(itemEl => <li role="none">{itemEl}</li>)}
            </ul>
        </details>

        passthroughAttrsToElement<HTMLDetailsElement>(this.#detailsElement, attrs)
    }

    /** Render this Component */
    override render(): HTMLDetailsElement {
        return this.#detailsElement
    }
}
