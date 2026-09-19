import { Component, getComponent, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { NavLink } from "./nav-link.tsx"
import { Menu } from "./menu.tsx"
import type { MenuItemType } from "./menu.tsx"
import { Tree } from "../data-display/tree.tsx"
import type { TreeNodeType } from "../data-display/tree.tsx"

/**
 * A single entry in a `<Sidebar/>`
 */
export type SidebarItemType = {
    /**
     * Identifies this entry. Defaults to `to` when unset, which is enough for a link; a group with
     * children has no `to` of its own, so give those one.
     */
    key?: string
    /** Displayed label for this entry */
    label: RenderableElements
    /** URL this entry links to. A group with `children` needs none */
    to?: string
    /**
     * Shown before the label - and, once the sidebar is collapsed to its rail, it is the *only*
     * thing shown, so a group without one is unidentifiable at that width.
     */
    icon?: RenderableElements
    /** Content at the trailing edge of the row - a count, a `Badge` */
    trailing?: RenderableElements
    /** Nested entries. An entry with children renders as a collapsible group */
    children?: SidebarItemType[]
    /** Should this group start expanded? (default: `false`) */
    defaultOpen?: boolean
}

/**
 * The account row at the foot of a `<Sidebar/>`
 */
export type SidebarProfileType = {
    /**
     * Shown at the leading edge, typically an `Avatar`. On the collapsed rail this is the whole
     * row, for the same reason an item's `icon` is.
     */
    avatar: RenderableElements
    /** The account's name */
    name: RenderableElements
    /** A smaller supporting line beneath the name - an email, an organisation */
    detail?: RenderableElements
    /** Entries for the menu the row opens. Supports submenus and dividers, like any `Menu` */
    menuItems: MenuItemType[]
    /** Accessible name for that menu. No default - the library doesn't assume a language */
    menuAriaLabel?: string
}

/**
 * Attrs type for `<Sidebar/>` Component
 */
export type SidebarAttrsType = {
    /** The set of entries to list. An entry with `children` becomes a collapsible group */
    items: SidebarItemType[]
    /** Optional content shown above the list (e.g. a search box or a section title) */
    header?: RenderableElements
    /** Optional content pinned below the list, above the profile row and the collapse control */
    footer?: RenderableElements
    /** An account row at the very foot, which opens a menu when clicked */
    profile?: SidebarProfileType
    /** Accessible label for the navigation landmark. No default - the library doesn't assume a language */
    ariaLabel?: string
    /** Forwarded to every item's underlying `NavLink` - see its own `spa` attr (default `false`) */
    spa?: boolean
    /** Forwarded to every item's underlying `NavLink` - see its own `exact` attr (default `true`) */
    exact?: boolean
    /** Adds a control that collapses the sidebar to an icon rail (default: `false`) */
    collapsible?: boolean
    /** Start collapsed. Only meaningful with `collapsible` (default: `false`) */
    defaultCollapsed?: boolean
    /** Called whenever the reader collapses or expands it - persist the value here if you want it remembered */
    onCollapsedChange?: (collapsed: boolean) => void
    /** Accessible name for the collapse control, which is an icon. No default - the library doesn't assume a language */
    collapseLabel?: string
    /** Lets the reader drag the trailing edge to resize (default: `false`) */
    resizable?: boolean
    /** Starting width in px (default: `250`) */
    defaultWidth?: number
    /** Smallest width a drag can reach, in px (default: `180`) */
    minWidth?: number
    /** Largest width a drag can reach, in px (default: `480`) */
    maxWidth?: number
    /** Called as a resize drag settles - persist the value here if you want it remembered */
    onWidthChange?: (width: number) => void
    /**
     * Called after a group opens or closes, with that item's `key`.
     *
     * Runs *after* the change, so reading `getTree().getOpenKeys()` inside it is safe. Needed by
     * anything that has to put the reader's expansions back later - a filterable sidebar replaces
     * its items, and the open state goes with them.
     */
    onToggle?: (key: string, open: boolean) => void
} & IdAttr & StylePassthroughAttrs

let areSidebarStylesMounted = false

const defaultWidthPx = 250
const railWidthPx = 56

/**
 * A themed vertical navigation panel, with the current page highlighted automatically.
 *
 * Entries may nest: an item with `children` renders as a collapsible group, built on `Tree` so the
 * open/close animation, the keyboard handling and the open-state API all come from one place
 * rather than a second copy of them here.
 *
 * Three things it does that a plain list cannot, each optional:
 *
 * - **`collapsible`** shrinks it to a rail of icons that floats back out over the page on hover or
 *   keyboard focus. The rail shows each group's `icon` and *nothing else*, including for a group
 *   the reader left expanded - see `#syncCollapsed`.
 * - **`resizable`** lets the trailing edge be dragged.
 * - **`profile`** pins an account row to the foot that opens a `Menu`.
 *
 * **Never call `refresh()` here.** Every `label`, `icon` and `trailing` is `RenderableElements`, so
 * it can hold a consumer's own components; each method below does a targeted DOM update instead.
 */
export class Sidebar extends Component<SidebarAttrsType> {
    #root: HTMLElement
    #panel: HTMLDivElement
    #tree: Tree
    #attrs: SidebarAttrsType
    #collapsed: boolean
    #width: number
    /** Every group's `<details>`, captured once, so marking the active one re-queries nothing */
    #groups: HTMLElement[] = []

    /**
     * Marks the group holding the current page.
     *
     * On the rail there is no label and no open group to show where the reader is, so without this
     * the sidebar can say which *page* is current while giving no clue which section it belongs
     * to. `NavLink` already decides what is active; this only asks which group contains it, so the
     * two can never disagree about the answer.
     */
    /** What `Tree` calls on a toggle: keep the active marker right, then tell the consumer */
    #handleToggle = (node: TreeNodeType, open: boolean) => {
        this.#syncActiveGroup()
        this.#attrs.onToggle?.(node.key, open)
    }

    #syncActiveGroup = () => {
        for (const group of this.#groups) {
            group.classList.toggle("vtd-sidebar-group-active", !!group.querySelector(".vtd-nav-link-active"))
        }
    }

    /**
     * Applies the collapsed state to the DOM.
     *
     * The rail hides a group's children with `display:none` rather than `visibility:hidden`. That
     * is the difference between a clean column of icons and a column with gaps in it: a group the
     * reader expanded keeps its children's height under `visibility`, so the rail ends up with
     * blank stretches between icons for content nobody can see.
     */
    #syncCollapsed() {
        this.#root.classList.toggle("vtd-sidebar-collapsed", this.#collapsed)
        this.#root.style.width = this.#collapsed ? `${railWidthPx}px` : `${this.#width}px`
        this.#panel.style.width = `${this.#width}px`
        const toggle = this.#root.querySelector(".vtd-sidebar-collapse")
        toggle?.setAttribute("aria-expanded", this.#collapsed ? "false" : "true")
    }

    /** Collapses or expands the sidebar */
    setCollapsed(collapsed: boolean): void {
        if (this.#collapsed == collapsed) {
            return
        }
        this.#collapsed = collapsed
        this.#syncCollapsed()
        this.#attrs.onCollapsedChange?.(collapsed)
    }

    /** Is the sidebar collapsed to its rail? */
    isCollapsed(): boolean {
        return this.#collapsed
    }

    /** The sidebar's expanded width in px - what a drag changes, unaffected by collapsing */
    getWidth(): number {
        return this.#width
    }

    /** Sets the expanded width in px, clamped to `minWidth`/`maxWidth` */
    setWidth(width: number): void {
        const min = this.#attrs.minWidth ?? 180
        const max = this.#attrs.maxWidth ?? 480
        this.#width = Math.round(Math.min(max, Math.max(min, width)))
        this.#syncCollapsed()
    }

    /** The `Tree` behind the groups, for reading or driving which are open */
    getTree(): Tree {
        return this.#tree
    }

    /**
     * Replaces the entries, rebuilding only the list.
     *
     * This exists so a filterable sidebar is possible at all. The obvious way to re-filter is to
     * re-render the whole component, and that destroys the `header` along with everything else -
     * which is where the search box lives, so the reader loses focus after the first character.
     * Only the body is rebuilt here; the header, the profile row, the collapsed state and the
     * dragged width all survive.
     *
     * The open/closed state does *not* survive, because the entries themselves are new. Read it
     * off `getTree()` before calling this and put it back through `defaultOpen` - which is what a
     * filter wants anyway, since it needs to force open whichever groups still hold a match.
     */
    setItems(items: SidebarItemType[]): void {
        this.#attrs = {...this.#attrs, items}
        const body = this.#panel.querySelector(".vtd-sidebar-body") as HTMLElement
        this.#tree = getComponent<Tree>(<Tree
            class="vtd-sidebar-tree"
            ariaLabel={this.#attrs.ariaLabel}
            nodes={this.#toNodes(items)}
            onToggle={this.#handleToggle}/>)
        body.replaceChildren(this.#tree.render())
        this.#groups = [...this.#root.querySelectorAll(".vtd-tree-node")] as HTMLElement[]
        this.#syncActiveGroup()
    }

    override mount() {
        globalThis.addEventListener("popstate", this.#syncActiveGroup)
        globalThis.addEventListener("locationchange", this.#syncActiveGroup)
        this.#syncActiveGroup()
    }

    override unmount() {
        globalThis.removeEventListener("popstate", this.#syncActiveGroup)
        globalThis.removeEventListener("locationchange", this.#syncActiveGroup)
    }

    /** Builds one entry's row: the icon, the label (a `NavLink` when it has a `to`) and the trailing slot */
    #buildRow(item: SidebarItemType): RenderableElements {
        if (!item.to) {
            return <span class="vtd-sidebar-label">{item.label}</span>
        }
        return <NavLink
            to={item.to}
            spa={this.#attrs.spa}
            exact={this.#attrs.exact}
            class="vtd-sidebar-link">{item.label}</NavLink>
    }

    /** Maps this component's items onto the nodes `Tree` renders */
    #toNodes(items: SidebarItemType[]): TreeNodeType[] {
        return items.map(item => ({
            key: item.key ?? item.to ?? String(item.label),
            label: this.#buildRow(item),
            leading: item.icon ? <span class="vtd-sidebar-icon">{item.icon}</span> : undefined,
            trailing: item.trailing,
            defaultOpen: item.defaultOpen,
            children: item.children && item.children.length > 0 ? this.#toNodes(item.children) : undefined,
        }))
    }

    /** The collapse control: a chevron drawn in CSS, which flips to point the other way */
    #buildCollapseControl(): RenderableElements {
        const button: HTMLButtonElement = <button
            type="button"
            class="vtd-sidebar-collapse"
            aria-label={this.#attrs.collapseLabel}
            aria-expanded={this.#collapsed ? "false" : "true"}
            onClick={() => { this.setCollapsed(!this.#collapsed) }}>
            <span class="vtd-sidebar-collapse-icon" aria-hidden="true"/>
        </button>
        return <div class="vtd-sidebar-collapse-row">{button}</div>
    }

    /** The account row, which is a `Menu` whose trigger is the row itself */
    #buildProfile(profile: SidebarProfileType): RenderableElements {
        const trigger = <span class="vtd-sidebar-profile-trigger">
            <span class="vtd-sidebar-profile-avatar">{profile.avatar}</span>
            <span class="vtd-sidebar-profile-text">
                <span class="vtd-sidebar-profile-name">{profile.name}</span>
                {profile.detail ? <span class="vtd-sidebar-profile-detail">{profile.detail}</span> : null}
            </span>
        </span>
        return <div class="vtd-sidebar-profile">
            <Menu
                class="vtd-sidebar-profile-menu"
                ariaLabel={profile.menuAriaLabel}
                trigger={trigger}
                items={profile.menuItems}/>
        </div>
    }

    /**
     * The drag handle on the trailing edge.
     *
     * `Resizable` is deliberately not reused here even though it does this job: it owns the width
     * of what it wraps, and this component has to reconcile a dragged width with a collapsed one -
     * two owners of the same property fighting over it. The drag listeners still follow its
     * pattern, living on `document` only for the duration of a drag rather than for the whole
     * component lifecycle.
     */
    #buildResizeHandle(): RenderableElements {
        const handle: HTMLElement = <div class="vtd-sidebar-resize" role="separator" aria-orientation="vertical"/>
        handle.addEventListener("pointerdown", (event: PointerEvent) => {
            event.preventDefault()
            const startX = event.clientX
            const startWidth = this.#width
            const onMove = (move: PointerEvent) => { this.setWidth(startWidth + (move.clientX - startX)) }
            const onUp = () => {
                document.removeEventListener("pointermove", onMove)
                document.removeEventListener("pointerup", onUp)
                this.#root.classList.remove("vtd-sidebar-resizing")
                this.#attrs.onWidthChange?.(this.#width)
            }
            this.#root.classList.add("vtd-sidebar-resizing")
            document.addEventListener("pointermove", onMove)
            document.addEventListener("pointerup", onUp)
        })
        return handle
    }

    constructor(attrs: SidebarAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        this.#collapsed = attrs.collapsible === true && attrs.defaultCollapsed === true
        this.#width = attrs.defaultWidth ?? defaultWidthPx
        if (!areSidebarStylesMounted) {
            areSidebarStylesMounted = true
            setStylesheet(`
.vtd-sidebar{
box-sizing:border-box;
position:relative;
flex-shrink:0;
transition:width 0.18s ease-in-out;
}
/*
 * The panel is absolutely positioned inside the sidebar so that expanding the rail on hover lays
 * it *over* the page rather than shoving the content sideways. The sidebar keeps the gutter; only
 * the panel grows.
 */
.vtd-sidebar-panel{
position:absolute;
inset-block:0;
inset-inline-start:0;
display:flex;
flex-direction:column;
box-sizing:border-box;
background-color:var(--background);
border-inline-end:1px solid var(--background-4);
overflow:hidden;
transition:width 0.18s ease-in-out, box-shadow 0.18s ease-in-out;
}
.vtd-sidebar-header{padding:0.75em;border-block-end:1px solid var(--background-4);flex-shrink:0;}
.vtd-sidebar-body{overflow-y:auto;flex-grow:1;padding:0.4em 0.35em;}
.vtd-sidebar-footer{flex-shrink:0;padding:0.5em;border-block-start:1px solid var(--background-4);}
/*
 * Every row - a group's summary, a link, a plain label - takes the same padding, so each one is the
 * same height and each icon sits at the same offset. That matters most on the rail, where the
 * icons are all there is: a top-level link with its own padding put its icon out of line with the
 * groups above it, which reads as a wobble down the column.
 */
.vtd-sidebar .vtd-tree-label,.vtd-sidebar-link,.vtd-sidebar-label{padding:0.45em 0.55em;}
.vtd-sidebar-link{
display:block;
border-radius:0.25rem;
color:inherit;
text-decoration:none;
}
.vtd-sidebar-link:hover{background-color:var(--background-2);}
.vtd-sidebar-link.vtd-nav-link-active{background-color:var(--primary-2);font-weight:bold;}
.vtd-sidebar-label{display:block;}
/* A leaf is only a wrapper - the link inside it is the whole row, and the indent belongs to the
   group's children rather than to each leaf, so a top-level leaf is not indented at all */
.vtd-sidebar .vtd-tree-leaf{padding:0;margin:0;border-radius:0;}
.vtd-sidebar .vtd-tree-leaf:hover{background-color:transparent;}
.vtd-sidebar .vtd-tree-children{padding-inline-start:0.9em;}
.vtd-sidebar-icon{display:inline-flex;align-items:center;font-size:1.05em;}
/*
 * The group holding the current page. Drawn as a leading bar rather than a fill so it reads the
 * same on the rail, where the label it would otherwise sit beside is not there to be tinted.
 */
.vtd-sidebar-group-active > .vtd-tree-label{position:relative;}
.vtd-sidebar-group-active > .vtd-tree-label::after{
content:"";
position:absolute;
inset-block:0.2em;
inset-inline-start:-0.35em;
width:0.2em;
border-radius:0.1em;
background-color:var(--primary-7);
}
.vtd-sidebar-group-active > .vtd-tree-label .vtd-sidebar-icon{color:var(--primary-8);}
.vtd-sidebar-resize{
position:absolute;
inset-block:0;
inset-inline-end:-3px;
width:6px;
cursor:col-resize;
touch-action:none;
}
.vtd-sidebar-resize:hover{background-color:var(--primary-3);}
.vtd-sidebar-resizing{user-select:none;}
.vtd-sidebar-resizing .vtd-sidebar,.vtd-sidebar-resizing .vtd-sidebar-panel{transition:none;}
.vtd-sidebar-collapse-row{flex-shrink:0;padding:0.4em;border-block-start:1px solid var(--background-4);display:flex;}
.vtd-sidebar-collapse{
cursor:pointer;
display:flex;
align-items:center;
justify-content:center;
width:100%;
padding:0.4em;
background:transparent;
border:1px solid transparent;
border-radius:0.25rem;
color:inherit;
}
.vtd-sidebar-collapse:hover{background-color:var(--background-2);}
.vtd-sidebar-collapse:focus-visible{border-color:var(--primary);outline:none;}
/*
 * A double chevron drawn in CSS rather than a glyph or an icon font, the same call Checkbox's tick
 * and Select's arrow make. It points the way the panel will move, so it flips when collapsed.
 */
.vtd-sidebar-collapse-icon{
display:inline-block;
position:relative;
width:1em;
height:0.7em;
transition:transform 0.18s ease-in-out;
}
.vtd-sidebar-collapse-icon::before,.vtd-sidebar-collapse-icon::after{
content:"";
position:absolute;
top:0.1em;
width:0.45em;
height:0.45em;
border:solid currentcolor;
border-width:0.12em 0 0 0.12em;
transform:rotate(-45deg);
}
.vtd-sidebar-collapse-icon::before{left:0.05em;}
.vtd-sidebar-collapse-icon::after{left:0.42em;}
.vtd-sidebar-collapsed .vtd-sidebar-collapse-icon{transform:rotate(180deg);}
.vtd-sidebar-profile{flex-shrink:0;border-block-start:1px solid var(--background-4);padding:0.4em;}
.vtd-sidebar-profile-menu{display:block;}
.vtd-sidebar-profile-menu .vtd-menu-trigger{display:block;padding:0.4em;border-radius:0.25rem;}
/* The profile's menu opens upward - it sits at the foot, and downward would be off-screen */
.vtd-sidebar-profile-menu .vtd-menu-list{top:auto;bottom:100%;margin-block:0 0.25em;}
.vtd-sidebar-profile-trigger{display:flex;align-items:center;gap:0.55em;min-width:0;}
.vtd-sidebar-profile-avatar{flex-shrink:0;display:inline-flex;}
.vtd-sidebar-profile-text{display:flex;flex-direction:column;min-width:0;}
.vtd-sidebar-profile-name{font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vtd-sidebar-profile-detail{font-size:0.8em;color:var(--background-9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/*
 * Collapsed, and not being hovered or keyboard-focused: only the icons remain. The children of an
 * expanded group go with display:none rather than visibility:hidden - under visibility they keep
 * their height, and the rail ends up with blank gaps between icons for rows nobody can see.
 */
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-sidebar-header,
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-sidebar-footer,
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-children,
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-disclosure-content{
display:none;
}
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-label-main,
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-trailing,
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-sidebar-profile-text{
visibility:hidden;
}
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree-label::before{opacity:0;}
/*
 * On the rail every top-level row is the same height, so the icons step down the column evenly. A
 * group's row is naturally taller than a plain link's - it carries a chevron and its own margin -
 * and left alone that difference reads as a wobble when the labels are gone and the icons are all
 * there is to line up.
 */
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree > li > .vtd-tree-label,
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree > li > .vtd-tree-leaf{
min-height:2.6em;
box-sizing:border-box;
display:flex;
align-items:center;
}
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-tree > li > .vtd-tree-leaf > .vtd-sidebar-link{flex-grow:1;}
.vtd-sidebar-collapsed:not(:hover):not(:focus-within) .vtd-sidebar-icon{font-size:1.35em;}
.vtd-sidebar-collapsed:hover .vtd-sidebar-panel,
.vtd-sidebar-collapsed:focus-within .vtd-sidebar-panel{box-shadow:0 2px 14px rgba(0,0,0,0.18);}
@media (prefers-reduced-motion: reduce){
.vtd-sidebar,.vtd-sidebar-panel,.vtd-sidebar-collapse-icon{transition:none;}
}
`, "vtd/Sidebar")
        }

        this.#tree = getComponent<Tree>(<Tree
            class="vtd-sidebar-tree"
            ariaLabel={attrs.ariaLabel}
            nodes={this.#toNodes(attrs.items)}
            onToggle={this.#handleToggle}/>)

        this.#panel = <div class="vtd-sidebar-panel">
            {attrs.header ? <div class="vtd-sidebar-header">{attrs.header}</div> : null}
            <div class="vtd-sidebar-body">{this.#tree}</div>
            {attrs.footer ? <div class="vtd-sidebar-footer">{attrs.footer}</div> : null}
            {attrs.profile ? this.#buildProfile(attrs.profile) : null}
            {attrs.collapsible ? this.#buildCollapseControl() : null}
        </div>

        this.#root = passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-sidebar">
            {this.#panel}
            {attrs.resizable ? this.#buildResizeHandle() : null}
        </nav>, attrs)

        this.#groups = [...this.#root.querySelectorAll(".vtd-tree-node")] as HTMLElement[]
        this.#syncCollapsed()
    }

    override render(): HTMLElement {
        return this.#root
    }
}
