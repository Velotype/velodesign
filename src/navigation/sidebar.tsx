import {Component, getComponent, passthroughAttrsToElement} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"
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
    /**
     * What the header shows once collapsed to the rail - a search icon standing in for a search
     * box, say.
     *
     * Setting it also **keeps the header's height**, so collapsing moves the entries sideways and
     * not up: with nothing to put there the header has to fold away, and everything below it
     * slides up by however tall it was. Left unset the header still folds, animated over the same
     * moment as the width, which is the right default when there is genuinely nothing to show at
     * 56px.
     */
    collapsedHeader?: RenderableElements
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
 * The states that float a collapsed sidebar back out to its full width.
 *
 * Written once and interpolated into every rule that depends on it, because the list has four
 * members and a rule that misses one is a bug you only find by doing the exact thing it missed:
 *
 * - `:hover` and `:has(:focus-visible)` are the pointer and the keyboard reaching for it.
 * - `.vtd-sidebar-resizing` holds it out for the length of a drag. Dragging the trailing edge
 *   *wider* moves the pointer off the sidebar by definition, so without this the panel collapsed
 *   out from under the pointer mid-drag while the button was still held down.
 * - `:has(.vtd-menu[open])` holds it out while the account menu is open, so the menu is never left
 *   standing over the page with the panel gone from under it.
 *
 * `:focus-within` is deliberately not in that list: the collapse control lives *inside* the panel,
 * so a mouse click on it leaves focus inside and would hold the panel open until the reader
 * clicked somewhere else entirely. A mouse click does not set `:focus-visible`, so the rail
 * collapses immediately while tabbing in still expands it.
 */
const floatTriggers = ":hover,:has(:focus-visible),.vtd-sidebar-resizing,:has(.vtd-menu[open])"
/** Collapsed, and none of those - the icon rail as the reader actually sees it */
const rail = `.vtd-sidebar-collapsed:not(${floatTriggers})`
/** Collapsed, but floated back out over the page */
const floated = `.vtd-sidebar-collapsed:is(${floatTriggers})`

/**
 * A themed vertical navigation panel, with the current page highlighted automatically.
 *
 * Entries may nest: an item with `children` renders as a collapsible group, built on `Tree` so the
 * open/close animation, the keyboard handling and the open-state API all come from one place
 * rather than a second copy of them here.
 *
 * Three things it does that a plain list cannot, each optional:
 *
 * - **`collapsible`** shrinks it to a rail of icons that floats back out over the page on hover,
 *   on keyboard focus, while its trailing edge is being dragged, and while its account menu is
 *   open. The rail shows each group's `icon` and nothing else, including for a group the reader
 *   left expanded - see `floatTriggers` and the collapsed rules in the stylesheet.
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
     * Two lines, and that is the whole of it: a class and a custom property. Everything the rail
     * looks like is a CSS rule reading one or the other, which is what lets the change *animate* -
     * a JS-driven rail would have to decide each piece's end state itself and would land all of
     * them in the frame of the click.
     */
    #syncCollapsed() {
        this.#root.classList.toggle("vtd-sidebar-collapsed", this.#collapsed)
        // The dragged width goes out as a custom property and every actual width is a CSS rule
        // reading it. Setting width inline instead pinned the panel open: an inline style beats a
        // class, so the collapsed rule could never narrow it and hovering could never widen it -
        // collapsing shrank the gutter and left a full-width panel sitting over the page.
        this.#root.style.setProperty("--vtd-sidebar-width", `${this.#width}px`)
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

    /**
     * Builds one entry's row - the icon, the label and the trailing slot, as a single element.
     *
     * **The whole row is one element, and it is the link when the entry has a `to`.** `Tree`'s
     * `leading`/`trailing` slots are deliberately not used for this: they are siblings of the
     * label, so a link in the label covers only the text between them and the icon and the count
     * on either side belong to the row instead. On a *group* that is the difference between two
     * competing actions and two separate ones - the chevron toggles, and everything else is a
     * destination you can click anywhere in, middle-click, or copy the address of. It also settles
     * what a click on the collapsed rail means, where the icon is the only thing there: it goes to
     * the group's own page, which is the only answer that does anything a reader can see.
     *
     * Reading order is still icon, label, count, so a screen reader announces "Typography 3" and
     * not "3 Typography" - that ordering is the reason `trailing` exists on `Tree` at all, and it
     * is kept here by markup order rather than by CSS.
     */
    #buildRow(item: SidebarItemType): RenderableElements {
        const content: RenderableElements[] = [
            item.icon ? <span class="vtd-sidebar-icon">{item.icon}</span> : null,
            <span class="vtd-sidebar-label">{item.label}</span>,
            item.trailing ? <span class="vtd-sidebar-trailing">{item.trailing}</span> : null,
        ]
        if (!item.to) {
            return <span class="vtd-sidebar-row">{content}</span>
        }
        return <NavLink
            to={item.to}
            spa={this.#attrs.spa}
            exact={this.#attrs.exact}
            class="vtd-sidebar-row vtd-sidebar-link">{content}</NavLink>
    }

    /** Maps this component's items onto the nodes `Tree` renders */
    #toNodes(items: SidebarItemType[]): TreeNodeType[] {
        return items.map(item => ({
            key: item.key ?? item.to ?? String(item.label),
            label: this.#buildRow(item),
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
            // No setPointerCapture here, deliberately: the move and up listeners go on `document`,
            // which already sees the drag wherever the pointer goes, and capture throws outright on
            // a pointerId that is not currently active - so it turns a synthetic pointerdown, which
            // is how a test drives this, into a resize handle that does nothing at all. The
            // `.vtd-sidebar-resizing` class added below is what keeps the panel from collapsing out
            // from under a pointer that has left it, which is the thing that actually needed fixing.
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
            mountStyles(`
/*
 * The root sets no position, deliberately.
 *
 * position says where a component sits on a page, which is the consumer's business - a
 * navigation sidebar is usually sticky under a header, and only the page knows how tall that
 * header is. This component used to set position:relative here, because the panel and the resize
 * handle are absolute and needed a containing block, and that put it in direct conflict with the
 * consumer over the same property. The consumer lost: their class has the same specificity, and
 * this stylesheet mounts when the component is constructed - inside their own render - so it
 * always comes later. The showcase asked for sticky, got relative, and its leftover top:53px then
 * offset the sidebar 53px *downward* instead of pinning it, so it sat too low and scrolled away.
 *
 * The containing block those two children actually need is .vtd-sidebar-rail, an element this
 * component owns outright. Nothing has to be overridden, so nothing has to out-specify anything.
 */
.vtd-sidebar{
box-sizing:border-box;
flex-shrink:0;
width:var(--vtd-sidebar-width,250px);
transition:width 0.18s ease-in-out;
}
.vtd-sidebar-collapsed{width:var(--vtd-sidebar-rail-width,${railWidthPx}px);}
/* The component's own positioning context, so the root's stays untouched */
.vtd-sidebar-rail{position:relative;width:100%;height:100%;}
/*
 * The panel is absolutely positioned inside the sidebar so that expanding the rail on hover lays
 * it *over* the page rather than shoving the content sideways. The sidebar keeps the gutter; only
 * the panel grows.
 *
 * It deliberately does not hide its overflow. Every piece of the panel narrows along with it - see
 * the note on shrinking below - so there is nothing left to clip, and clipping cost more than it
 * saved: the account menu opens a submenu beside its own row, past the panel's trailing edge, and
 * a panel that clipped its overflow cut that submenu in half. The two places that genuinely have
 * to clip - a scrolling body and a folding header or footer - each do it themselves.
 */
.vtd-sidebar-panel{
position:absolute;
inset-block:0;
inset-inline-start:0;
width:var(--vtd-sidebar-width,250px);
display:flex;
flex-direction:column;
box-sizing:border-box;
background-color:var(--background);
border-inline-end:1px solid var(--background-4);
transition:width 0.18s ease-in-out, box-shadow 0.18s ease-in-out;
}
/* max-height rather than display:none so the list slides up in step with the width rather than
   jumping the instant the class lands - see the collapsed rules below */
.vtd-sidebar-header{
padding:0.75em;
border-block-end:1px solid var(--background-4);
flex-shrink:0;
overflow:hidden;
max-height:14em;
transition:max-height 0.18s ease-in-out, padding 0.18s ease-in-out;
}
.vtd-sidebar-body{overflow-y:auto;overflow-x:hidden;flex-grow:1;padding:0.4em 0.35em;}
.vtd-sidebar-footer{
flex-shrink:0;
overflow:hidden;
max-height:14em;
padding:0.5em;
border-block-start:1px solid var(--background-4);
transition:max-height 0.18s ease-in-out, padding 0.18s ease-in-out;
}
/*
 * The padding goes on the row element, once, and that is what makes the row a hit target rather
 * than just a line of text.
 *
 * Both containers - a group's <summary> and a leaf's wrapper - give it up entirely, so the one
 * element inside them covers every pixel a reader would aim at. Padding the container instead
 * leaves a ring around the row that belongs to the container, which on a group means a ring that
 * *toggles* around a row that navigates: the two actions interleaved at the edges, which is the
 * opposite of telling them apart. Padding both, which this once did, gave a group row twice the
 * inset and made it 18px taller than a link row.
 */
.vtd-sidebar .vtd-tree-label,.vtd-sidebar .vtd-tree-leaf{padding:0;margin:0;border-radius:0;}
.vtd-sidebar-row{
display:flex;
align-items:center;
justify-content:center;
gap:0.4em;
flex-grow:1;
min-width:0;
padding:0.45em 0.55em;
border-radius:0.25rem;
box-sizing:border-box;
transition:gap 0.18s ease-in-out;
}
.vtd-sidebar-link{color:inherit;text-decoration:none;}
/*
 * The hover belongs to the two things that do something, not to the container holding them.
 *
 * Tree gives every row a hover of its own, which is right for a tree and wrong here: a group's
 * chevron and its link are separate controls, and a single wash across the whole row says they are
 * one. Suppressed on the container, the row lights under the link and the chevron lights under the
 * chevron, so which of the two a click is about to reach is visible before it happens.
 */
.vtd-sidebar .vtd-tree-label:hover,.vtd-sidebar .vtd-tree-leaf:hover{background-color:transparent;}
.vtd-sidebar-link:hover{background-color:var(--background-2);}
.vtd-sidebar-link.vtd-nav-link-active{background-color:var(--primary-2);font-weight:bold;}
/*
 * The chevron is as tall as the row it splits, not as tall as the glyph inside it.
 *
 * Sized to its own 1.25em it was a 20px control beside a 39px one, and two hit areas of different
 * heights sitting flush against each other read as a mistake rather than as a pair - the point of
 * separating them is that a reader can see which is which, and that only works if each looks like
 * a deliberate target. align-self:stretch takes the height from the flex row, so it tracks whatever
 * padding the row has without either of them being restated.
 */
.vtd-sidebar .vtd-tree-chevron{
align-self:stretch;
height:auto;
margin-inline-start:0.2em;
transition:width 0.18s ease-in-out, margin 0.18s ease-in-out, opacity 0.18s ease-in-out;
}
.vtd-sidebar .vtd-tree-children{padding-inline-start:0.9em;}
/* A top-level leaf has no chevron, so it needs the room one would have taken or its icon sits a
   chevron's width to the left of every group's. It collapses with the chevron on the rail. */
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf{
padding-inline-start:1.7em;
transition:padding-inline-start 0.18s ease-in-out;
}
/*
 * Every top-level row is one height, in *both* states - not just on the rail.
 *
 * A group's row is naturally taller than a plain link's, it carries a chevron and its own margin,
 * and the rail used to add a min-height that the expanded panel did not have. So each row changed
 * height at the moment of collapsing, and every icon below it slid to a new vertical position
 * while the width was still animating. Pinning the height makes the icons hold still and leaves
 * the width as the only thing moving.
 */
.vtd-sidebar .vtd-tree > li > .vtd-tree-node > .vtd-tree-label,
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf{
min-height:2em;
box-sizing:border-box;
display:flex;
align-items:center;
}
/*
 * NOTHING ON THE RAIL LEAVES LAYOUT. This is the single idea the collapsed rules below are built
 * on, and it is what makes the whole transition animate rather than jump.
 *
 * Every row is a flex line whose text - a label, a count, the account name - may shrink to nothing
 * (min-width:0 with overflow:hidden) while the icon holds its size (flex-shrink:0). Narrowing the
 * panel therefore squeezes the text out continuously and leaves the icon centred on its own, and
 * the only thing each piece still has to do for itself is *fade*. Opacity is the one property here
 * that transitions cleanly in both directions.
 *
 * The previous approach took each label out of flow the instant the class landed
 * (position:absolute + clip-path). It measured correctly and looked wrong: the text vanished in a
 * single frame while the panel spent the next 180ms sliding, and the same jump ran backwards on
 * the way out. That is what the reader sees as the labels popping.
 *
 * white-space:nowrap is what makes it safe to leave a label in flow at 56px at all. A label that
 * wraps makes its row taller than its neighbours, and that drift - icons sliding to new vertical
 * positions as the panel moves - is the bug this component keeps rediscovering.
 *
 * max-width is what takes it the last few pixels, and shrinking alone will not: flex stops
 * shrinking the moment the line fits, so a label keeps whatever room is left over. On a group's
 * row that leftover is a pixel or two and invisible; on a *leaf* row, which carries no padding of
 * its own because its link is the whole row, it was 19px - and with the label holding it, the free
 * space justify-content had to centre was all on one side and the icon sat hard against the
 * leading edge. The cap is applied at the end of the transition rather than across it - see the
 * collapsed rules for why that delay is load-bearing.
 */
.vtd-sidebar-label,.vtd-sidebar-trailing,.vtd-sidebar-profile-text{
min-width:0;
flex-shrink:1;
overflow:hidden;
max-width:100%;
transition:opacity 0.18s ease-in-out;
}
.vtd-sidebar-label{flex-grow:1;white-space:nowrap;text-overflow:ellipsis;}
/*
 * Centring is unconditional, which is only possible because of the rule above: expanded, the label
 * grows to fill the line and centring has nothing left to do; collapsed, the label is zero wide
 * and the icon is the whole line. A rule that only centred on the rail would be one more thing
 * switching state at the moment of the click.
 */
/*
 * A fixed box, so the glyph inside can be drawn larger than its line without taking more room -
 * and so the icon, not the label, is the tallest thing in a row. That makes an expanded row and a
 * collapsed one the same height by construction rather than by a tuned min-height that only
 * happens to match at one font size.
 *
 * One size in both states, and it is the larger one. It used to be scaled up by a transform only
 * while collapsed, so the icons grew as the panel closed and shrank as it opened - a size change
 * nobody asked for, reading as a wobble. The box is stated in the *row's* em rather than the
 * icon's own, so raising the glyph size does not change the row: 1.15em at font-size:1.365em is
 * the same 1.57em of the row that 1.5em at font-size:1.05em was.
 */
.vtd-sidebar-icon{
display:inline-flex;
align-items:center;
justify-content:center;
flex-shrink:0;
font-size:1.365em;
width:1.15em;
height:1.15em;
}
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
/* Flush inside the panel's trailing edge, and a child of the panel rather than of the rail: against
   the rail it tracked the *gutter*, so once collapsed it sat at 56px and stayed there while hover
   floated the panel out to full width - a drag target stranded 200px from the edge it resizes */
inset-inline-end:0;
width:6px;
cursor:col-resize;
touch-action:none;
}
.vtd-sidebar-resize:hover{background-color:var(--primary-3);}
.vtd-sidebar-resizing{user-select:none;}
/* The root *is* .vtd-sidebar, so this has to be a compound rather than a descendant selector.
   Written as a descendant it silently matched nothing and the sidebar's own width trailed 180ms
   behind the pointer for the whole drag. */
.vtd-sidebar.vtd-sidebar-resizing,.vtd-sidebar-resizing .vtd-sidebar-panel{transition:none;}
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
/*
 * Scoped under .vtd-sidebar-profile, and that is the whole point of the selector rather than an
 * accident of how it reads.
 *
 * Menu is an overlay trigger, so its root is display:inline-block like every other one in the
 * package. Here it is a row of the sidebar and has to fill it. Written as .vtd-sidebar-profile-menu
 * this rule is *one class*, exactly like .vtd-menu, and an equal-specificity tie is broken by
 * order - so it loses, every time, because this stylesheet mounts in Sidebar's constructor and
 * Menu's mounts a few lines later when the profile Menu is constructed. Same trap as the root's
 * position, one component further in.
 *
 * Left inline-block it shrank to fit, and what it fit was .vtd-menu-list's min-width:10em - so the
 * account row was 160px wide inside a 250px sidebar however wide the reader dragged it, and the
 * avatar moved *sideways* through the collapse: it drifted toward the centre of a row still pinned
 * at 160 and then jumped back 46px in a single frame when the shrink-to-fit finally gave way.
 */
.vtd-sidebar-profile .vtd-menu{display:block;}
.vtd-sidebar-profile-menu .vtd-menu-trigger{display:block;padding:0.4em;border-radius:0.25rem;}
/* The profile's menu opens upward - it sits at the foot, and downward would be off-screen */
.vtd-sidebar-profile-menu .vtd-menu-list{top:auto;bottom:100%;margin-block:0 0.25em;}
.vtd-sidebar-profile-trigger{
display:flex;
align-items:center;
justify-content:center;
gap:0.55em;
min-width:0;
transition:gap 0.18s ease-in-out;
}
.vtd-sidebar-profile-avatar{flex-shrink:0;display:inline-flex;}
/* flex-grow so the line fills when expanded, which is what makes the justify-content:center above
   a no-op there and a real centring on the rail */
.vtd-sidebar-profile-text{display:flex;flex-direction:column;flex-grow:1;min-width:0;}
.vtd-sidebar-profile-name{font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vtd-sidebar-profile-detail{font-size:0.8em;color:var(--background-9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

/* ---- Collapsed to the rail, and not floated back out ---- */

/*
 * A group's children slide shut on the disclosure's own animation, by forcing to zero the very
 * grid track its open/close transition already drives. display:none took them out in a single
 * frame - and it had to, because under visibility they keep their height and the rail grows a
 * blank stretch where a group's entries were (measured, one 236px gap among rows 49px apart).
 * Collapsing the track has neither problem: no height, and it gets there over 200ms.
 */
${rail} .vtd-disclosure-content{
grid-template-rows:minmax(0,0fr);
visibility:hidden;
transition:grid-template-rows 0.2s ease-out, visibility 0s linear 0.2s;
}
/* Everything that is only text on the rail fades out in place. It keeps its box (a zero-width one,
   see above) and stays in the accessibility tree, which is what display:none would have cost. */
/*
 * The cap lands at the *end* of the fade, not across it, and the delay is the whole of what keeps
 * the icons still.
 *
 * Shrinking the cap over the same 180ms as the panel looks like the obvious thing and is not: the
 * two run on independent curves, so the text gave up room faster than the row lost it, free space
 * appeared in the middle of the transition, and justify-content:center chased it. Measured, the
 * account avatar went 13 -> 29 -> 14: a 16px round trip to end up a pixel from where it started.
 *
 * Held at 100% instead, the text is shrunk by flex alone - which is driven by the row, exactly in
 * step with it - so the line stays full, there is no free space to centre into, and nothing moves
 * horizontally at all. The cap then closes the last couple of pixels in one frame at the end.
 * Expanding needs no delay in the other direction: the cap lifts immediately and flex simply hands
 * the room back as the row grows.
 */
${rail} .vtd-sidebar-label,
${rail} .vtd-sidebar-trailing,
${rail} .vtd-sidebar-profile-text{
opacity:0;
max-width:0;
transition:opacity 0.18s ease-in-out, max-width 0s linear 0.18s;
}
${rail} .vtd-sidebar-row{gap:0;}
${rail} .vtd-sidebar-profile-trigger{gap:0;}
${rail} .vtd-tree-chevron{width:0;margin:0;opacity:0;}
${rail} .vtd-tree > li > .vtd-tree-leaf{padding-inline-start:0;}
/* With nothing to show at 56px the header folds away over the same 180ms the width takes, so the
   icons below it move with the panel instead of snapping up the moment it is clicked */
${rail} .vtd-sidebar-header:not(.vtd-sidebar-header-swaps){
max-height:0;
padding-block:0;
border-block-end-color:transparent;
}
${rail} .vtd-sidebar-footer{
max-height:0;
padding-block:0;
border-block-start-color:transparent;
}
/*
 * Given a collapsedHeader, the header keeps its height instead and cross-fades what is inside it,
 * so collapsing moves the entries sideways rather than up.
 *
 * The full content stays in flow and keeps defining that height - which is why it hides with
 * visibility rather than display, the one place on this component where keeping the box is the
 * point. visibility flips at the *end* of the fade on the way out and at the start on the way in,
 * so the content is never both invisible and still tabbable. The rail content is laid over it and
 * costs no height of its own.
 */
.vtd-sidebar-header-swaps{position:relative;}
.vtd-sidebar-header-full{transition:opacity 0.18s ease-in-out, visibility 0s linear 0s;}
.vtd-sidebar-header-rail{
position:absolute;
inset:0;
display:flex;
align-items:center;
justify-content:center;
opacity:0;
visibility:hidden;
transition:opacity 0.18s ease-in-out, visibility 0s linear 0.18s;
}
${rail} .vtd-sidebar-header-full{
opacity:0;
visibility:hidden;
transition:opacity 0.18s ease-in-out, visibility 0s linear 0.18s;
}
${rail} .vtd-sidebar-header-rail{
opacity:1;
visibility:visible;
transition:opacity 0.18s ease-in-out, visibility 0s linear 0s;
}
/* Collapsed, the panel matches the rail; any of the float triggers brings the full panel back out
   over the page */
.vtd-sidebar-collapsed .vtd-sidebar-panel{width:var(--vtd-sidebar-rail-width,${railWidthPx}px);}
${floated} .vtd-sidebar-panel{
width:var(--vtd-sidebar-width,250px);
box-shadow:0 2px 14px rgba(0,0,0,0.18);
}
@media (prefers-reduced-motion: reduce){
.vtd-sidebar,
.vtd-sidebar-panel,
.vtd-sidebar-collapse-icon,
.vtd-sidebar-header,
.vtd-sidebar-footer,
.vtd-sidebar-header-full,
.vtd-sidebar-header-rail,
.vtd-sidebar-profile-trigger,
.vtd-sidebar-profile-text,
.vtd-sidebar-row,
.vtd-sidebar-label,
.vtd-sidebar-trailing,
.vtd-sidebar .vtd-tree-chevron,
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf,
${rail} .vtd-disclosure-content{transition:none;}
}
`, "vtd/Sidebar", "composite")
        }

        this.#tree = getComponent<Tree>(<Tree
            class="vtd-sidebar-tree"
            ariaLabel={attrs.ariaLabel}
            nodes={this.#toNodes(attrs.items)}
            onToggle={this.#handleToggle}/>)

        this.#panel = <div class="vtd-sidebar-panel">
            {attrs.header ? <div class={`vtd-sidebar-header${attrs.collapsedHeader ? " vtd-sidebar-header-swaps" : ""}`}>
                <div class="vtd-sidebar-header-full">{attrs.header}</div>
                {attrs.collapsedHeader ? <div class="vtd-sidebar-header-rail">{attrs.collapsedHeader}</div> : null}
            </div> : null}
            <div class="vtd-sidebar-body">{this.#tree}</div>
            {attrs.footer ? <div class="vtd-sidebar-footer">{attrs.footer}</div> : null}
            {attrs.profile ? this.#buildProfile(attrs.profile) : null}
            {attrs.collapsible ? this.#buildCollapseControl() : null}
        </div>

        if (attrs.resizable) {
            // Inside the panel, not beside it. Against the rail the handle tracked the *gutter*, so
            // once collapsed it sat at 56px - and stayed there while hovering floated the panel out
            // to its full width, leaving the drag target stranded 200px from the edge it resizes.
            this.#panel.appendChild(this.#buildResizeHandle() as HTMLElement)
        }
        this.#root = passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-sidebar">
            <div class="vtd-sidebar-rail">
                {this.#panel}
            </div>
        </nav>, attrs)

        this.#groups = [...this.#root.querySelectorAll(".vtd-tree-node")] as HTMLElement[]
        this.#syncCollapsed()
    }

    override render(): HTMLElement {
        return this.#root
    }
}
