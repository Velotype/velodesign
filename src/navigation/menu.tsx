import {Component, passthroughAttrsToElement} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { History } from "../core/history.ts"
import { themeOptions } from "../core/theme-options.ts"
import type { ThemeSymbol } from "../core/theme-options.ts"

/**
 * A single entry in a `<Menu/>`
 */
export type MenuItemType = {
    /** Displayed label for this entry */
    label: RenderableElements
    /** If set, this entry renders as a link to this URL (for a navigational submenu) */
    href?: string
    /**
     * If `true` (default `false`), and `href` is also set, clicking this entry intercepts the
     * browser's own navigation and calls `History.changeLocation(href)` instead - a client-side
     * route change with no full page reload, for an SPA. Left `false` (matching this component's
     * original behavior, so existing consumers relying on it see no change), `href` navigates
     * normally - a real page load, for a multi-page site, or for a `href` that's genuinely
     * external and should never be client-side-routed even from inside an SPA. Ignored when
     * `href` isn't set (an actions-menu entry with only `onClick` has no navigation to intercept).
     */
    spa?: boolean
    /** Called when this entry is clicked (for an actions menu) */
    onClick?: () => void
    /**
     * Leaves the menu open after this entry is clicked (default: `false`).
     *
     * For an entry that *does* something rather than going somewhere, and does it in place - a
     * theme switch, a density toggle, anything the reader may want to try twice. Closing on those
     * takes the control out from under the pointer at the moment it takes effect, so seeing the
     * result and changing your mind about it costs a second trip through the menu. A submenu the
     * entry sits in stays open too, for the same reason.
     *
     * Navigation is the opposite case and keeps the default: the menu is gone with the page.
     */
    keepOpen?: boolean
    /**
     * Marks this entry as the chosen one among the checkable entries of **its own list**, and
     * renders it `role="menuitemradio"` with a tick.
     *
     * Setting it on two or more siblings makes them a radio group, which is the shape this is for -
     * a theme picker, a density picker, a sort order. `Menu` moves the selection itself on a click,
     * so the tick follows the pointer without the consumer rebuilding anything; `onClick` still
     * fires, which is where the choice gets persisted. Pair it with `keepOpen` when the reader
     * should be able to see the result and pick again.
     *
     * Leaving it `undefined` is not the same as `false`: `false` is an unselected member of a
     * group, `undefined` is an ordinary entry that is not part of one and gets no tick, no reserved
     * space for one, and the plain `menuitem` role.
     *
     * **Pass a function when something outside this menu can change the same setting**, and it is
     * re-read every time the menu opens. A plain boolean is a reading taken once, when the menu was
     * built, so a second control for the same setting - another menu, a toolbar toggle - leaves it
     * describing a state that is no longer true, and a wrong indicator is worse than none. A
     * function cannot go stale: two menus over one setting both show the truth without either
     * knowing the other exists.
     */
    selected?: boolean | (() => boolean)
    /** Is this entry disabled? */
    disabled?: boolean
    /**
     * Nested entries. An item with children opens a submenu beside itself rather than acting, so
     * its own `href`/`onClick` are ignored - a parent that both navigated and opened a submenu
     * would fire whichever the pointer happened to reach first.
     */
    children?: MenuItemType[]
    /**
     * Draws a divider immediately *above* this entry, separating it from what came before.
     *
     * A property of the entry that follows rather than an entry of its own, which is the choice
     * worth explaining: a divider in the array would need `label` to become optional, weakening
     * every other entry's type, and would let a menu start or end with a stray rule. This way a
     * leading divider is simply ignored, and the grouping is stated where it applies.
     */
    dividerBefore?: boolean
}

/**
 * Attrs type for `<Menu/>` Component
 */
export type MenuAttrsType = {
    /** Content that opens the menu when clicked */
    trigger: RenderableElements
    /** The set of entries to show */
    items: MenuItemType[]
    /**
     * Accessible name for the trigger, e.g. "More actions".
     *
     * No default, like every other ARIA label here - see CLAUDE.md's language-agnostic rule. Worth
     * setting whenever `trigger` is a glyph rather than words, or the control has no name at all.
     */
    ariaLabel?: string
    /** Closes the menu when the user clicks anywhere outside of it (default: `true`) */
    closeOnOutsideClick?: boolean
} & IdAttr & StylePassthroughAttrs

/**
 * Theme options for `<Menu/>`
 */
export const MenuThemeOptions: {
    /** Marks the selected entry of a checkable group. Defaults to `CommonThemeOptions.confirmSymbol` */
    confirmSymbol: ThemeSymbol
} = themeOptions({confirmSymbol: "confirmSymbol"})

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
    /**
     * What arrow-key/Home/End navigation moves between, read from the DOM each time rather than
     * captured once: a submenu changes the reachable set the moment it opens, so a list built at
     * construction would either skip its entries or offer entries nobody can see.
     */
    #navigableItems(): HTMLElement[] {
        return [...this.#detailsElement.querySelectorAll(".vtd-menu-item")]
            .filter(el => (el as HTMLElement).checkVisibility({checkVisibilityCSS: true})) as HTMLElement[]
    }

    /** Closes every open submenu, and optionally moves focus back to the row that opened one */
    #closeSubmenus(except?: Element) {
        for (const parent of this.#detailsElement.querySelectorAll(".vtd-menu-entry-open")) {
            if (parent != except) {
                parent.classList.remove("vtd-menu-entry-open")
                parent.querySelector(".vtd-menu-item-parent")?.setAttribute("aria-expanded", "false")
            }
        }
    }
    /**
     * Every checkable entry whose `selected` is a function, re-read each time the menu opens.
     *
     * On open rather than continuously: a menu that is shut has no indicator to keep right, and
     * anything that polled would be paying for it on every page in the consumer's app.
     */
    #liveChecks: {row: HTMLElement, read: () => boolean}[] = []

    #syncLiveChecks = () => {
        if (!this.#detailsElement.open) {
            return
        }
        for (const check of this.#liveChecks) {
            check.row.setAttribute("aria-checked", check.read() ? "true" : "false")
        }
    }

    /** Attrs captured at construction, read by `#handleDocumentClick` (see the `Command` doc note on why this can't just close over the constructor's `attrs` parameter) */
    #attrs: MenuAttrsType

    #closeMenu = (restoreFocus = false) => {
        this.#detailsElement.removeAttribute("open")
        this.#closeSubmenus()
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
        const active = document.activeElement as HTMLElement | null
        const openParent = active?.closest(".vtd-menu-entry-open")
        if (event.key == "Escape") {
            if (!this.#detailsElement.open) {
                return
            }
            event.preventDefault()
            // Escape unwinds one level at a time, which is the APG behaviour: inside a submenu it
            // closes that submenu and returns to the row that opened it, and only then the menu
            if (openParent) {
                this.#closeSubmenus()
                ;(openParent.querySelector(".vtd-menu-item-parent") as HTMLElement | null)?.focus()
                return
            }
            this.#closeMenu(true)
            return
        }
        if (!this.#detailsElement.open) {
            return
        }
        const items = this.#navigableItems()
        if (items.length == 0) {
            return
        }
        const currentIndex = items.indexOf(active as HTMLElement)
        if (event.key == "ArrowDown") {
            event.preventDefault()
            items[(currentIndex + 1) % items.length]?.focus()
        } else if (event.key == "ArrowUp") {
            event.preventDefault()
            items[(currentIndex - 1 + items.length) % items.length]?.focus()
        } else if (event.key == "Home") {
            event.preventDefault()
            items[0]?.focus()
        } else if (event.key == "End") {
            event.preventDefault()
            items[items.length - 1]?.focus()
        } else if (event.key == "ArrowRight") {
            const entry = active?.closest(".vtd-menu-entry")
            if (active?.classList.contains("vtd-menu-item-parent") && entry) {
                event.preventDefault()
                this.#openSubmenu(entry)
                ;(entry.querySelector(".vtd-menu-sublist .vtd-menu-item") as HTMLElement | null)?.focus()
            }
        } else if (event.key == "ArrowLeft") {
            if (openParent) {
                event.preventDefault()
                this.#closeSubmenus()
                ;(openParent.querySelector(".vtd-menu-item-parent") as HTMLElement | null)?.focus()
            }
        }
    }

    /**
     * Moves the selection onto one checkable entry, within its own list.
     *
     * Scoped to the list rather than the whole menu, because a menu may hold more than one group -
     * a sort order and a density, say - and a selection that reached across them would clear the
     * other group every time. Done here rather than by the consumer handing back new items: a
     * rebuild would close whatever submenu the entry lives in, which is the one thing `keepOpen`
     * exists to prevent.
     */
    #select(row: HTMLElement) {
        const list = row.closest(".vtd-menu-list, .vtd-menu-sublist")
        for (const sibling of list?.querySelectorAll(":scope > li > [role=menuitemradio]") ?? []) {
            sibling.setAttribute("aria-checked", sibling == row ? "true" : "false")
        }
    }

    /** Opens one submenu, closing any sibling that was open - only one branch at a time */
    #openSubmenu(entry: Element) {
        this.#closeSubmenus(entry)
        entry.classList.add("vtd-menu-entry-open")
        entry.querySelector(".vtd-menu-item-parent")?.setAttribute("aria-expanded", "true")
    }

    /** Mount this Component */
    override mount() {
        document.addEventListener("click", this.#handleDocumentClick)
    }

    /** Unmount this Component */
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    /**
     * Builds one level of the menu. Called again for each submenu, so nesting is however deep the
     * consumer's data goes.
     */
    #buildEntries(items: MenuItemType[]): RenderableElements[] {
        return items.map((item, index) => {
            // A leading divider would be a rule above the first row, against the edge of the
            // menu - ignored rather than drawn, so a consumer can mark a group's first entry
            // without checking whether it happens to be first overall
            const divided = item.dividerBefore && index > 0 ? " vtd-menu-entry-divided" : ""

            if (item.children && item.children.length > 0) {
                const parentRow: HTMLElement = <div
                    role="menuitem"
                    tabindex={-1}
                    aria-haspopup="menu"
                    aria-expanded="false"
                    class={`vtd-menu-item vtd-menu-item-parent${item.disabled ? " vtd-menu-item-disabled" : ""}`}
                >{item.label}</div>
                const entry: HTMLElement = <li class={`vtd-menu-entry vtd-menu-entry-parent${divided}`} role="none">
                    {parentRow}
                    <ul class="vtd-menu-sublist" role="menu">{this.#buildEntries(item.children)}</ul>
                </li>
                // Pointer and keyboard open the same submenu through the same class, so there is
                // one open state rather than a CSS :hover rule racing a scripted one
                entry.addEventListener("pointerenter", () => { this.#openSubmenu(entry) })
                parentRow.addEventListener("click", (event: Event) => {
                    event.preventDefault()
                    if (entry.classList.contains("vtd-menu-entry-open")) {
                        this.#closeSubmenus()
                    } else {
                        this.#openSubmenu(entry)
                    }
                })
                return entry
            }

            const checkable = item.selected !== undefined
            const readSelected = typeof item.selected == "function" ? item.selected : undefined
            const isSelected = readSelected ? readSelected() : item.selected === true
            const row: HTMLAnchorElement = <a
                role={checkable ? "menuitemradio" : "menuitem"}
                aria-checked={checkable ? (isSelected ? "true" : "false") : undefined}
                href={item.href || "#"}
                aria-disabled={item.disabled}
                class={`vtd-menu-item${checkable ? " vtd-menu-item-checkable" : ""}${item.disabled ? " vtd-menu-item-disabled" : ""}`}
                onClick={(event: Event) => {
                    if (item.disabled) {
                        event.preventDefault()
                        return
                    }
                    if (!item.href) {
                        event.preventDefault()
                    } else if (item.spa) {
                        event.preventDefault()
                        History.changeLocation(item.href)
                    }
                    if (checkable) {
                        this.#select(row)
                    }
                    item.onClick?.()
                    if (item.keepOpen) {
                        return
                    }
                    this.#closeSubmenus()
                    this.#closeMenu()
                }}>
                {checkable ? <span class="vtd-menu-check" aria-hidden="true"><MenuThemeOptions.confirmSymbol/></span> : null}
                {item.label}
            </a>
            if (readSelected) {
                this.#liveChecks.push({row, read: readSelected})
            }
            const leaf: HTMLElement = <li class={`vtd-menu-entry${divided}`} role="none">{row}</li>
            // Moving onto a row at this level closes whatever submenu a sibling had open, so the
            // pointer never leaves a stranded flyout behind it
            leaf.addEventListener("pointerenter", () => { this.#closeSubmenus(leaf.parentElement?.closest(".vtd-menu-entry-open") ?? undefined) })
            return leaf
        })
    }

    /** Create a new `<Menu/>` Component */
    constructor(attrs: MenuAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        if (!areMenuStylesMounted) {
            areMenuStylesMounted = true
            mountStyles(`
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
/*
 * Keyboard position in a popup list is a tinted fill, not a ring: the rows are full-bleed inside
 * the panel, so an offset outline would run into its edges. It must differ from hover, which is
 * where this was wrong - Menu and ContextMenu highlighted the focused row with exactly the colour
 * their hover already used, so moving through a menu by keyboard looked the same as pointing at it,
 * and on a row the pointer happened to rest on it looked like nothing at all. Same tint as Command
 * and the two listboxes, so one colour means one thing everywhere in the package.
 */
.vtd-menu-item:focus-visible{background-color:var(--primary-3);outline:none;}
.vtd-menu-item-disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;}
/*
 * The tick is always rendered and only its opacity changes, so the label sits in the same place
 * whether or not this is the selected entry. Rendering it conditionally would move every label in
 * the group sideways each time the reader picked a different one.
 */
.vtd-menu-item-checkable{display:flex;align-items:center;gap:0.4em;}
.vtd-menu-check{
display:inline-flex;
align-items:center;
justify-content:center;
flex-shrink:0;
width:1em;
opacity:0;
color:var(--primary);
}
.vtd-menu-item-checkable[aria-checked="true"]{font-weight:bold;}
.vtd-menu-item-checkable[aria-checked="true"] .vtd-menu-check{opacity:1;}
/*
 * An entry is the positioning context for its own submenu, so a flyout sits beside the row that
 * opened it rather than beside the menu as a whole.
 */
.vtd-menu-entry{position:relative;}
/* A divider belongs to the entry below it, drawn in its margin so no row changes height */
.vtd-menu-entry-divided{
margin-block-start:0.3em;
padding-block-start:0.3em;
border-block-start:1px solid var(--background-4);
}
/* The parent row is a div, not a link - there is nothing to navigate to, and a link that only
   opened a submenu would be announced as a destination */
.vtd-menu-item-parent{cursor:pointer;display:flex;align-items:center;gap:0.5em;}
/* A caret drawn in CSS, for the same reason the rest of the package does: no icon-font dependency */
.vtd-menu-item-parent::after{
content:"";
margin-inline-start:auto;
width:0.4em;
height:0.4em;
border:solid currentcolor;
border-width:0.1em 0.1em 0 0;
transform:rotate(45deg);
flex-shrink:0;
}
.vtd-menu-sublist{
display:none;
position:absolute;
inset-inline-start:100%;
top:-0.25em;
min-width:10em;
padding:0.25em;
margin:0;
list-style:none;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.15);
}
/*
 * One open state, set by both pointer and keyboard. A :hover rule as well would race it: the
 * pointer could open one branch while the keyboard had another open, and neither would know.
 */
.vtd-menu-entry-open > .vtd-menu-sublist{display:block;}
.vtd-menu-entry-open > .vtd-menu-item-parent{background-color:var(--background-2);}
`, "vtd/Menu")
        }

        this.#summaryElement = <summary class="vtd-menu-trigger" aria-label={attrs.ariaLabel}>{attrs.trigger}</summary>

        this.#detailsElement = <details class="vtd-menu" onToggle={this.#syncLiveChecks} onKeyDown={this.#handleKeyDown}>
            {this.#summaryElement}
            <ul class="vtd-menu-list" role="menu">
                {this.#buildEntries(attrs.items)}
            </ul>
        </details>

        passthroughAttrsToElement<HTMLDetailsElement>(this.#detailsElement, attrs)
    }

    /** Render this Component */
    override render(): HTMLDetailsElement {
        return this.#detailsElement
    }
}
