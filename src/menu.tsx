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

    /** Close the menu if it's open and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#detailsElement.open) {
            return
        }
        if (event.target instanceof Node && this.#detailsElement.contains(event.target)) {
            return
        }
        this.#detailsElement.removeAttribute("open")
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
z-index:1;
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
.vtd-menu-item-disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;}
`, "vtd/Menu")
        }

        const closeMenu = () => {
            this.#detailsElement.removeAttribute("open")
        }

        this.#detailsElement = <details class="vtd-menu">
            <summary class="vtd-menu-trigger">{attrs.trigger}</summary>
            <ul class="vtd-menu-list" role="menu">
                {attrs.items.map(item => <li role="none">
                    <a
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
                            closeMenu()
                        }}>{item.label}</a>
                </li>)}
            </ul>
        </details>

        passthroughAttrsToElement<HTMLDetailsElement>(this.#detailsElement, attrs)
    }

    /** Render this Component */
    override render(): HTMLDetailsElement {
        return this.#detailsElement
    }
}
