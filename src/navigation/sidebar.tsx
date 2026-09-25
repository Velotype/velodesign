import {Component, getComponent, passthroughAttrsToElement} from "../core/velotype.ts"
import { setChildren } from "../core/dom-lifecycle.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, RenderObject, StylePassthroughAttrs } from "../core/velotype.ts"
import { NavLink } from "./nav-link.tsx"
import { Menu } from "./menu.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Sidebar/>` Component Theme
 */
export const SidebarThemeOptions: {
    /**
     * Dismisses the overlay panel.
     *
     * **Its own glyph rather than `CommonThemeOptions.closeSymbol`.** In overlay mode the panel's
     * header can hold a search box, and that box has a cross of its own for emptying it - two
     * crosses a few pixels apart, one clearing a field and one shutting the whole panel, with
     * nothing but position to tell them apart. A cross is the right mark for *clearing*, so the
     * panel takes a different one: an arrow curving back, which says where it goes rather than
     * what it removes.
     *
     * The `\uFE0E` is a variation selector forcing text presentation - without it the arrow is an
     * emoji on platforms that have one, and arrives full-colour at a size of its own choosing.
     *
     * The glyph is flipped in CSS rather than swapped for another codepoint: what is wanted is an
     * arrow whose tail curves up and whose head points back, and no arrow in Unicode draws that
     * while staying as legible as this one does upside down. The wrapper also lets the flip carry
     * an optical correction: this glyph is drawn entirely *above* the baseline, so its ink already
     * sits high in its line box, and mirroring throws it exactly as far low - measured at 2.47px
     * of a 20px box. The box is centred by the button either way; `translateY` centres what is
     * actually drawn in it.
     */
    closeSymbol: ThemeSymbol
} = themeOptions({}, {
    closeSymbol: function(){return <span class="vtd-sidebar-close-glyph">{closeGlyph}</span>}
})

/**
 * U+21A9 leftwards arrow with hook, followed by U+FE0E.
 *
 * A named constant rather than the characters inline, for both halves: escapes written straight
 * into JSX are text, so `<span>\u21A9</span>` renders those six characters; and U+FE0E is
 * invisible in source, so pasting the pair leaves a file with a character in it that nothing on
 * screen accounts for.
 */
const closeGlyph = "\u21A9\uFE0E"
import type { MenuItemType } from "./menu.tsx"
import { Tree } from "../data-display/tree.tsx"
import type { TreeNodeType } from "../data-display/tree.tsx"
import { addGlobalListener, clearTimeoutHelper, getPathname, matchMediaHelper, removeGlobalListener, requestFrame, setTimeoutHelper } from "../core/utilities.ts"

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
    /**
     * Draws a rule above this entry, for separating one run of entries from the next.
     *
     * Ignored on the first entry, where it would be a rule against the top of the list - so a
     * consumer can mark a group's first item without checking whether it happens to be first
     * overall. Same name and same behaviour as `Menu`'s.
     */
    dividerBefore?: boolean
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
    /**
     * Accessible name for the overlay's close control, which is an icon. No default - the library
     * doesn't assume a language.
     */
    closeLabel?: string
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
     * Shared open/overlay state, to hand to a `Navbar` so it can draw the menu control.
     *
     * Construct it yourself and pass the same object to both:
     * `const nav = new RenderObject<SidebarNavState>({open: false, overlay: false})`.
     */
    nav?: RenderObject<SidebarNavState>
    /**
     * Below this width the sidebar stops being a column and becomes an overlay (default: `48em`).
     *
     * Any CSS length `matchMedia` accepts. **Watched in JS rather than written as a media query**,
     * because a stylesheet here is mounted once for every instance of the component, so a rule
     * baked into it could not vary per sidebar - and this has to, or it is not overridable at all.
     *
     * ⚠️ **Only has an effect when `nav` is also set**, and that is deliberate rather than an
     * oversight: an overlay is hidden until something opens it, so a sidebar that overlaid itself
     * with no control anywhere would take the navigation off the page entirely. `nav` is how a
     * control is wired, so requiring it is what guarantees one exists. Pass your own `RenderObject`
     * and call `toggle()` from your own button if you are not using `Navbar`.
     *
     * Set `overlayBelow={""}` to switch the behaviour off and keep a column at every width.
     */
    overlayBelow?: string
    /**
     * Called after a group opens or closes, with that item's `key`.
     *
     * Runs *after* the change, so reading `getTree().getOpenKeys()` inside it is safe. Needed by
     * anything that has to put the reader's expansions back later - a filterable sidebar replaces
     * its items, and the open state goes with them.
     */
    onToggle?: (key: string, open: boolean) => void
} & IdAttr & StylePassthroughAttrs

/**
 * The two facts a `Navbar` and a `Sidebar` have to agree on, carried in one `RenderObject` the
 * consumer constructs and hands to both.
 *
 * It is a `RenderObject` rather than a component reference because **JSX does not evaluate to the
 * component instance** - `createElement` returns the rendered element - while TypeScript types the
 * expression as the class, so `<Navbar sidebar={<Sidebar/>}/>` compiles and then fails at runtime.
 * Both spellings typecheck, against the class and against any interface it satisfies, so the
 * compiler cannot tell the working one from the broken one. A `RenderObject` is a plain constructor
 * call, so that mistake cannot be written. It is also the shape `TextFormField` already takes for
 * its `field`, and `Navbar` needs only the type, so it pulls none of `Sidebar` into a bundle.
 */
export type SidebarNavState = {
    /** Is the overlay panel showing? Only meaningful while `overlay` is true */
    open: boolean
    /**
     * Is the sidebar narrow enough to be an overlay rather than a column?
     *
     * **`Sidebar` owns this and writes it**, from `collapseBelow`; `Navbar` only reads it, to know
     * whether to draw its menu control at all. Stating the breakpoint in both places instead would
     * let them disagree - a menu button shown while the sidebar is still a column, or the reverse.
     */
    overlay: boolean
}

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
/** Stylesheet for `<Sidebar/>`, mounted once on first construction */
const sidebarCss: string = `
.vtd-sidebar{
box-sizing:border-box;
flex-shrink:0;
width:var(--vtd-sidebar-width,250px);
transition:width 0.18s ease-in-out;
}
.vtd-sidebar-collapsed{width:var(--vtd-sidebar-rail-width,${railWidthPx}px);}
` +
/* The component's own positioning context, so the root's stays untouched */
`
.vtd-sidebar-rail{position:relative;width:100%;height:100%;}
` +
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
`
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
` +
/* max-height rather than display:none so the list slides up in step with the width rather than
   jumping the instant the class lands - see the collapsed rules below */
`
.vtd-sidebar-header{
padding:0.75em;
border-block-end:1px solid var(--background-4);
flex-shrink:0;
overflow:hidden;
max-height:14em;
transition:max-height 0.18s ease-in-out, padding 0.18s ease-in-out;
}
.vtd-sidebar-body{overflow-y:auto;overflow-x:hidden;flex-grow:1;padding:0.4em 0.35em;}
` +
/*
 * Room for the focus ring inside the clipping containers.
 *
 * A group's children live in `disclosure-view`'s content box, which clips its overflow so the rows
 * are hidden while the grid track collapses - that is what makes opening and closing animate. The
 * ring is an outline 2px wide at a 2px offset, so it reaches 4px past the row, and a row that fills
 * its container exactly had 0px to put it in: tabbing to a sub-category drew a ring nobody could
 * see. Padding the clip box out and pulling it back with an equal negative margin moves the clip
 * edge without moving anything on screen.
 *
 * Scoped to the sidebar rather than fixed in `disclosure-view`: `Collapse` and `Accordion` pad their
 * content generously already, so they have the room, and widening the clip box for every disclosure
 * in the package to solve one component's problem is the wrong trade.
 *
 * The block axis cannot use the same trick, because `overflow` clips at the *padding* box: vertical
 * padding here would leave a 4px sliver of the sub-links showing while the category is collapsed.
 * The first and last rows take a margin instead, which is real room *inside* the clip box and
 * collapses away with everything else when the grid track shrinks to `0fr`. Margins are safe to use
 * here specifically because the inner is a grid item, and a grid item establishes an independent
 * formatting context - so a child's block margin cannot collapse through it and escape the very
 * container the room was being made in.
 */
`
.vtd-sidebar .vtd-disclosure-content-inner{padding-inline:4px;margin-inline:-4px;}
.vtd-sidebar .vtd-disclosure-content-inner>:first-child{margin-block-start:4px;}
.vtd-sidebar .vtd-disclosure-content-inner>:last-child{margin-block-end:4px;}
.vtd-sidebar-footer{
flex-shrink:0;
overflow:hidden;
max-height:14em;
padding:0.5em;
border-block-start:1px solid var(--background-4);
transition:max-height 0.18s ease-in-out, padding 0.18s ease-in-out;
}
` +
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
`
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
` +
/*
 * A `dividerBefore` rule, drawn the way Menu draws its own so the two read as one idea.
 *
 * Margin above the rule and padding below it, rather than padding on both sides: the row's own
 * background - the hover and the active fill - paints to the padding edge, so a symmetric padding
 * would pull the fill up to touch the line above it.
 *
 * ⚠️ **It stays on the rail, rule and spacing both.** Suppressing it there was tried and is wrong
 * twice over: the grouping is *more* useful on the rail, not less - the labels that carried it are
 * gone, so the rule is all that is left saying these rows are a separate run - and removing the
 * margin, padding and border takes 16.2px out of the layout, so every icon below it jumped that
 * far up as the panel collapsed. Nothing on the rail may leave layout; that is the rule the whole
 * collapse animation is built on, and this broke it.
 */
`
.vtd-sidebar-row-divided{
margin-block-start:0.45em;
padding-block-start:0.5em;
border-block-start:1px solid var(--background-4);
border-start-start-radius:0;
border-start-end-radius:0;
}
` +
/*
 * The hover belongs to the two things that do something, not to the container holding them.
 *
 * Tree gives every row a hover of its own, which is right for a tree and wrong here: a group's
 * chevron and its link are separate controls, and a single wash across the whole row says they are
 * one. Suppressed on the container, the row lights under the link and the chevron lights under the
 * chevron, so which of the two a click is about to reach is visible before it happens.
 */
`
.vtd-sidebar .vtd-tree-label:hover,.vtd-sidebar .vtd-tree-leaf:hover{background-color:transparent;}
.vtd-sidebar-link:hover{background-color:var(--background-2);}
.vtd-sidebar-link.vtd-nav-link-active{background-color:var(--primary-4);font-weight:bold;}
` +
/*
 * The chevron is as tall as the row it splits, not as tall as the glyph inside it.
 *
 * Sized to its own 1.25em it was a 20px control beside a 39px one, and two hit areas of different
 * heights sitting flush against each other read as a mistake rather than as a pair - the point of
 * separating them is that a reader can see which is which, and that only works if each looks like
 * a deliberate target. align-self:stretch takes the height from the flex row, so it tracks whatever
 * padding the row has without either of them being restated.
 */
`
.vtd-sidebar .vtd-tree-chevron{
align-self:stretch;
height:auto;
order:1;
margin-inline-start:0.2em;
margin-inline-end:0;
transition:width 0.18s ease-in-out, margin 0.18s ease-in-out, opacity 0.18s ease-in-out;
}
.vtd-sidebar .vtd-tree-children{padding-inline-start:0.9em;}
` +
/*
 * The chevron sits at the *trailing* edge of a group's row, which is why nothing here indents a
 * leaf to make room for one.
 *
 * Leading was the obvious place and was wrong twice over. Every row then began a chevron's width
 * in, so a leaf - an entry with no children - had to be padded by hand to put its icon under the
 * groups' icons, and that padding is dead space the row's own link never covers: the reader aims
 * at the left of the row and hits nothing. Moving the chevron to the end lines every icon up at
 * one left edge without a correction, and hands the whole leading run of the row back to the link.
 *
 * A group's row still stops short of its chevron, and that is the point - the chevron is a
 * separate control with a target of its own, so the row and the toggle stay distinguishable.
 */
`
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf{padding-inline-start:0;}
` +
/*
 * Every top-level row is one height, in *both* states - not just on the rail.
 *
 * A group's row is naturally taller than a plain link's, it carries a chevron and its own margin,
 * and the rail used to add a min-height that the expanded panel did not have. So each row changed
 * height at the moment of collapsing, and every icon below it slid to a new vertical position
 * while the width was still animating. Pinning the height makes the icons hold still and leaves
 * the width as the only thing moving.
 */
`
.vtd-sidebar .vtd-tree > li > .vtd-tree-node > .vtd-tree-label,
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf{
min-height:2em;
box-sizing:border-box;
display:flex;
align-items:center;
}
` +
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
`
.vtd-sidebar-label,.vtd-sidebar-trailing,.vtd-sidebar-profile-text{
min-width:0;
flex-shrink:1;
overflow:hidden;
max-width:100%;
transition:opacity 0.18s ease-in-out;
}
.vtd-sidebar-label{flex-grow:1;white-space:nowrap;text-overflow:ellipsis;}
` +
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
`
.vtd-sidebar-icon{
display:inline-flex;
align-items:center;
justify-content:center;
flex-shrink:0;
font-size:1.365em;
width:1.15em;
height:1.15em;
}
` +
/*
 * The group holding the current page. Drawn as a leading bar rather than a fill so it reads the
 * same on the rail, where the label it would otherwise sit beside is not there to be tinted.
 */
`
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
` +
/*
 * A top-level entry with no children gets the same marker its groups get.
 *
 * Only groups had one, so the current page was findable at a glance inside a category and invisible
 * when it *was* a top-level entry - the fill alone measured 1.34:1 against the panel in light and
 * 1.09:1 in dark, which is not a cue anyone can see. A leaf has no group to carry the bar for it,
 * so it carries its own, and the two kinds of destination now mark themselves the same way.
 */
`
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf > .vtd-nav-link-active{position:relative;}
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf > .vtd-nav-link-active::after{
content:"";
position:absolute;
inset-block:0.2em;
inset-inline-start:-0.35em;
width:0.2em;
border-radius:0.1em;
background-color:var(--primary-7);
}
.vtd-sidebar .vtd-tree > li > .vtd-tree-leaf > .vtd-nav-link-active .vtd-sidebar-icon{color:var(--primary-8);}
.vtd-sidebar-resize{
position:absolute;
inset-block:0;
` +
/* Flush inside the panel's trailing edge, and a child of the panel rather than of the rail: against
   the rail it tracked the *gutter*, so once collapsed it sat at 56px and stayed there while hover
   floated the panel out to full width - a drag target stranded 200px from the edge it resizes */
`
inset-inline-end:0;
width:6px;
cursor:col-resize;
touch-action:none;
}
.vtd-sidebar-resize:hover{background-color:var(--primary-3);}
.vtd-sidebar-resizing{user-select:none;}
` +
/* The root *is* .vtd-sidebar, so this has to be a compound rather than a descendant selector.
   Written as a descendant it silently matched nothing and the sidebar's own width trailed 180ms
   behind the pointer for the whole drag. */
`
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
` +
/*
 * A double chevron drawn in CSS rather than a glyph or an icon font, the same call Checkbox's tick
 * and Select's arrow make. It points the way the panel will move, so it flips when collapsed.
 */
`
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
` +
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
`
.vtd-sidebar-profile .vtd-menu{display:block;}
.vtd-sidebar-profile-menu .vtd-menu-trigger{display:block;padding:0.4em;border-radius:0.25rem;}
` +
/* The profile's menu opens upward - it sits at the foot, and downward would be off-screen */
`
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
` +
/* flex-grow so the line fills when expanded, which is what makes the justify-content:center above
   a no-op there and a real centring on the rail */
`
.vtd-sidebar-profile-text{display:flex;flex-direction:column;flex-grow:1;min-width:0;}
.vtd-sidebar-profile-name{font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vtd-sidebar-profile-detail{font-size:0.8em;color:var(--background-9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
` +
/* ---- Collapsed to the rail, and not floated back out ---- */
/*
 * A group's children slide shut on the disclosure's own animation, by forcing to zero the very
 * grid track its open/close transition already drives. display:none took them out in a single
 * frame - and it had to, because under visibility they keep their height and the rail grows a
 * blank stretch where a group's entries were (measured, one 236px gap among rows 49px apart).
 * Collapsing the track has neither problem: no height, and it gets there over 200ms.
 */
`
${rail} .vtd-disclosure-content{
grid-template-rows:minmax(0,0fr);
visibility:hidden;
transition:grid-template-rows 0.2s ease-out, visibility 0s linear 0.2s;
}
` +
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
`
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
` +
/* With nothing to show at 56px the header folds away over the same 180ms the width takes, so the
   icons below it move with the panel instead of snapping up the moment it is clicked */
`
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
` +
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
`
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
` +
/* Collapsed, the panel matches the rail; any of the float triggers brings the full panel back out
   over the page */
`
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
` +
/*
 * Overlay mode: below `overlayBelow` the sidebar stops taking a column of the page and lays itself
 * over it instead. Two problems it solves at once - the panel was a fixed width at every viewport,
 * so at 390px a 250px sidebar left 140px of content and the page scrolled sideways; and the rail's
 * float-out is driven by :hover, which a touch device does not have, so the icon rail had no way
 * to show a reader what its icons meant.
 *
 * `position:fixed` on the panel and a zero-width rail, so the column the sidebar occupied collapses
 * entirely rather than staying as a gutter. The panel translates rather than un-rendering, for the
 * same reason the scrim only changes opacity: an element that stops rendering leaves its transition
 * pending forever and never animates again.
 */
`
.vtd-sidebar-scrim{
position:fixed;
inset:0;
z-index:1;
background-color:rgba(0,0,0,0.45);
opacity:0;
visibility:hidden;
` +
/*
 * pointer-events, not just visibility. The scrim fades over 0.18s, and for the whole of that fade a
 * visibility-only scrim still swallows clicks - so tapping the menu control to close and reopen
 * lands on the scrim instead and nothing happens. pointer-events flips on the class rather than on
 * the transition, so the moment it is closing it stops intercepting.
 */
`
pointer-events:none;
transition:opacity 0.18s ease-in-out, visibility 0s linear 0.18s;
}
` +
/*
 * The root's width goes to zero, not just the rail's: `.vtd-sidebar` carries the width that makes
 * the sidebar a column, and leaving it would keep a 250px gutter beside a panel that is now laid
 * over the page. This rule is later in the same sheet than the `.vtd-sidebar` it overrides, which
 * is what lets a single class beat a single class.
 */
`
.vtd-sidebar-overlay{width:0;}
` +
/*
 * Overlay mode is a surface that covers the screen, not a drawer down one edge.
 *
 * A drawer was tried first and is the wrong shape for this content. The panel is not a short menu -
 * it is nine categories over seventy-eight entries with a search box and an account row, which is a
 * browsing task in its own right, and on a 390px screen that wants the whole screen rather than 85%
 * of it beside a sliver nobody can use. The sliver's only job was being somewhere to tap, and a
 * close control does that better and says so.
 *
 * `inset:0` with `margin:auto` and a `max-width`, so it fills a phone and becomes a centred sheet
 * on anything wider - one rule covering both without a second breakpoint.
 *
 * ⚠️ `position:fixed` is fine *here* where it was not for the drawer. The jump it used to cause -
 * the panel teleporting from below the header to the top of the viewport, because `position` cannot
 * be interpolated - happened because the drawer was visible while sliding across that change. This
 * surface is invisible when closed, so the switch lands where there is nothing to see.
 */
`
.vtd-sidebar-overlay .vtd-sidebar-panel{
position:fixed;
inset:0;
margin:auto;
z-index:2;
width:100%;
max-width:32em;
height:100%;
max-height:100%;
border:none;
border-radius:0;
opacity:0;
visibility:hidden;
transform:scale(0.98);
transition:opacity 0.18s ease-in-out, transform 0.18s ease-in-out, visibility 0s linear 0.18s;
}
.vtd-sidebar-overlay-open .vtd-sidebar-panel{
opacity:1;
visibility:visible;
transform:scale(1);
transition:opacity 0.18s ease-in-out, transform 0.18s ease-in-out, visibility 0s linear 0s;
box-shadow:0 0 2em rgba(0,0,0,0.35);
}
` +
/*
 * The close control. Sized to the package's touch floor and pinned to the trailing edge of the
 * surface, where a full-screen sheet's dismiss lives - it is `display:none` outside overlay mode
 * rather than merely invisible, so it never takes a tab stop in the column layout.
 */
`
.vtd-sidebar-top{display:contents;}
.vtd-sidebar-close{display:none;}
` +
/*
 * In overlay mode the wrapper becomes a real row, and `align-items:center` is what puts the close
 * control on the same centre line as whatever the header holds - a search box here. Positioning it
 * absolutely against the panel instead lined its *top* up with the header's top, which with a 26px
 * control beside a 31px input reads as a control sitting slightly high.
 *
 * `margin-inline-start:auto` rather than `justify-content`, so it is pushed to the trailing edge
 * whether or not there is a header beside it.
 */
`
.vtd-sidebar-overlay .vtd-sidebar-top{
display:flex;
align-items:center;
gap:0.9em;
padding-inline-end:0.5em;
border-block-end:1px solid var(--background-4);
}
` +
/*
 * The header keeps its `overflow:hidden` here (it is what lets the header collapse on the rail), so
 * zeroing its trailing padding to sit the search box against the close control left the search
 * box's focus ring with 0px to draw into and cut it off. 4px of padding is the ring's exact reach,
 * and the equal negative margin hands it straight back to the flex row, so the clip edge moves and
 * nothing on screen does - the ring simply draws over 4px of the row's 0.5em gap.
 */
`
.vtd-sidebar-overlay .vtd-sidebar-top .vtd-sidebar-header{
flex:1;
min-width:0;
padding-inline-end:4px;
margin-inline-end:-4px;
border-block-end:none;
}
` +
/*
 * The rule under the header belongs to the *row*, not the header, once there is a close control
 * beside it. The header is a flex item that stops where that control begins, so its own
 * border-block-end drew a line across part of the panel and then stopped - 344px of a 390px panel
 * on a phone, which reads as an unfinished divider rather than as the edge of a section.
 *
 * The close control carries a surface of its own, which a borderless glyph did not.
 *
 * In overlay mode it sits beside the panel's header content, and a header holding a search box puts
 * two small marks a few pixels apart: the field's own clear control and this. Both were a bare
 * cross at roughly one size and one colour, 14px apart, and nothing said which emptied the box and
 * which shut the panel. The field's control belongs *to the field* - it is inside the input's
 * border, unboxed and muted - so this one is drawn as what it is instead: a control of the panel's
 * chrome, with a fill, a border and more room between them.
 */
`
.vtd-sidebar-overlay .vtd-sidebar-close{
display:inline-flex;
align-items:center;
justify-content:center;
flex-shrink:0;
margin-inline-start:auto;
min-width:28px;
min-height:28px;
padding:0.25em;
font-size:1em;
line-height:1;
background-color:var(--background-2);
border:1px solid var(--background-4);
border-radius:0.25rem;
color:var(--text);
cursor:pointer;
}
.vtd-sidebar-overlay .vtd-sidebar-close:hover{background-color:var(--background-3);}
.vtd-sidebar-close-glyph{
display:block;
line-height:1;
transform:translateY(-0.15em) scaleY(-1);
}
.vtd-sidebar-overlay .vtd-sidebar-close:hover{background-color:var(--background-2);}

` +
/* The panel takes focus when it opens, and a ring around the whole drawer says nothing useful */
`
.vtd-sidebar-panel:focus{outline:none;}
.vtd-sidebar-overlay-open .vtd-sidebar-panel{transform:translateX(0);}
.vtd-sidebar-overlay-open .vtd-sidebar-scrim{
opacity:1;
visibility:visible;
pointer-events:auto;
transition:opacity 0.18s ease-in-out, visibility 0s linear 0s;
}
` +
/*
 * In overlay mode the panel is always its full width - the rail, the float-out and the resize
 * handle are all answers to sharing a row with the page, and it no longer does. Collapsing it to
 * 56px over a dimmed page would be a rail nobody asked for, floated out by a hover that a touch
 * device does not have.
 */
`
.vtd-sidebar-overlay .vtd-sidebar-resize{display:none;}
.vtd-sidebar-overlay .vtd-sidebar-collapse-row{display:none;}
` +
/*
 * The panel held still while the mode changes - see `#switchModeWithoutAnimatingPanel`. The root is
 * not in this selector, so the column's own width still animates shut behind it.
 */
`
.vtd-sidebar-switching .vtd-sidebar-panel,.vtd-sidebar-switching .vtd-sidebar-scrim{
transition:none !important;
}
` +
/* Reduced motion switches off every part of the overlay, the fade and the scale alike */
`
@media (prefers-reduced-motion: reduce){
.vtd-sidebar-scrim,.vtd-sidebar-overlay .vtd-sidebar-panel,.vtd-sidebar-overlay{transition:none;}
}
`

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
    /** Watches `overlayBelow`. Undefined when the behaviour is switched off */
    #media: MediaQueryList | undefined

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

    /**
     * Marks the row for the current page, and then the group holding it.
     *
     * The rows are `NavLink`s and now keep themselves current as well, since `setItems` attaches
     * the tree through `replaceChildrenOfChild` and their `mount` therefore runs. This stays
     * because **the two cannot be relied on to run in that order.** A `NavLink` built by
     * `setItems` registers its `popstate` listener *after* this component registered its own, so
     * on the next navigation `#syncActiveGroup` would read row markers the rows had not updated
     * yet, and the group marker would lag a page behind. Deciding the row state here first makes
     * the group marker a function of it rather than a race against it.
     *
     * The rule matches `NavLink`'s exactly - `exact` compares the whole pathname, otherwise
     * `startsWith` - so the two never disagree about an answer, only about who wrote it.
     */
    #syncActiveLinks = () => {
        const exact = this.#attrs.exact ?? true
        const path = getPathname()
        for (const link of this.#root.querySelectorAll("a.vtd-sidebar-link")) {
            const href = link.getAttribute("href")
            const active = href != null && (exact ? path == href : path.startsWith(href))
            link.classList.toggle("vtd-nav-link-active", active)
            // `aria-current` is the half a screen reader hears, and dropping it would leave the
            // sidebar looking right and announcing nothing
            if (active) {
                link.setAttribute("aria-current", "page")
            } else {
                link.removeAttribute("aria-current")
            }
        }
    }

    #syncActiveGroup = () => {
        this.#syncActiveLinks()
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
        // ⚠️ The rail is a *column* behaviour, and in overlay mode the class is not applied at all -
        // `#collapsed` is still remembered, so it comes back when the sidebar is a column again.
        //
        // Not a specificity fix, deliberately. Overriding the rail's rules from an overlay rule
        // loses: `${rail}` is `.vtd-sidebar-collapsed:not(<four triggers>)`, and `:not()` carries
        // the specificity of its most specific argument - `:has(.vtd-menu[open])` - so the rail's
        // label rule is (0,4,0) against an overlay rule's (0,3,0). The visible symptom was precise:
        // an open overlay panel collapsed to icons the moment the pointer left the window, because
        // `:not(:hover)` started matching again and the rail rule took back over.
        const overlay = this.#navState().overlay
        this.#root.classList.toggle("vtd-sidebar-collapsed", this.#collapsed && !overlay)
        // The dragged width goes out as a custom property and every actual width is a CSS rule
        // reading it. Setting width inline instead pinned the panel open: an inline style beats a
        // class, so the collapsed rule could never narrow it and hovering could never widen it -
        // collapsing shrank the gutter and left a full-width panel sitting over the page.
        this.#root.style.setProperty("--vtd-sidebar-width", `${this.#width}px`)
        const toggle = this.#root.querySelector(".vtd-sidebar-collapse")
        toggle?.setAttribute("aria-expanded", this.#collapsed ? "false" : "true")
    }

    /**
     * Applies overlay mode and the open state to the DOM.
     *
     * Same shape as `#syncCollapsed`: classes only, so every visual is a CSS rule and the panel can
     * animate rather than being positioned frame by frame from here.
     */
    /** The open state as the DOM was last left, so a change can be told from a re-sync */
    #wasOpen = false

    #syncOverlay = () => {
        const state = this.#navState()
        this.#root.classList.toggle("vtd-sidebar-overlay", state.overlay)
        // Whether the rail applies depends on the mode, so it is re-decided here too
        this.#root.classList.toggle("vtd-sidebar-collapsed", this.#collapsed && !state.overlay)
        this.#root.classList.toggle("vtd-sidebar-overlay-open", state.overlay && state.open)
        // A panel that is off-screen must not be a tab stop, or Tab walks into a nav nobody can see
        this.#panel.toggleAttribute("inert", state.overlay && !state.open)

        // ⚠️ Focus is handled here rather than in `open()`/`close()`, because those are not the only
        // way the panel opens - `Navbar`'s control writes straight to the shared state, so a method
        // that moves focus would simply never run for the one caller that matters. Everything that
        // changes the state comes through here.
        const isOpen = state.overlay && state.open
        if (isOpen != this.#wasOpen) {
            this.#wasOpen = isOpen
            if (isOpen) {
                const active = document.activeElement
                this.#returnFocusTo = active instanceof HTMLElement ? active : undefined
                // The panel itself, not the first control in it: the first control is the search
                // box, and focusing an input on a touch device throws the keyboard up over the nav
                // the reader has just asked to see. `inert` came off a line ago, so it can hold it.
                this.#panel.focus()
            } else if (this.#returnFocusTo?.isConnected) {
                // Back where it came from, or the reader's next Tab starts from the top of the page
                this.#returnFocusTo.focus()
                this.#returnFocusTo = undefined
            }
        }
    }

    /**
     * Open/overlay state for a sidebar given no `nav` object of its own.
     *
     * ⚠️ Not a constant. Reading `{open: false, overlay: false}` and writing nowhere is what this
     * used to do, and it left overlay mode switched off for every sidebar that was not wired to a
     * `Navbar`: the media query fired, `#setNavState` dropped the result, and `#syncOverlay` then
     * read the frozen `false` back and took the class off again. `open()` and `close()` were
     * no-ops for the same reason. `nav` is for *sharing* the state with another control, so a
     * sidebar without one still needs somewhere to keep it.
     */
    #localNav: SidebarNavState = {open: false, overlay: false}

    #navState(): SidebarNavState {
        return this.#attrs.nav?.get() ?? this.#localNav
    }

    #setNavState(next: Partial<SidebarNavState>): void {
        const nav = this.#attrs.nav
        if (!nav) {
            // Every caller follows this with `#syncOverlay`, so storing it is the whole job here -
            // there are no listeners to notify without a shared object
            this.#localNav = {...this.#localNav, ...next}
            return
        }
        const current = nav.get()
        const merged = {...current, ...next}
        if (merged.open == current.open && merged.overlay == current.overlay) {
            return
        }
        // `set` replaces the whole value, which is what notifies every listener - Navbar included
        nav.set(merged)
    }

    /**
     * Crossing the breakpoint animates, and the reason it *can* is that nothing discontinuous
     * happens any more.
     *
     * This used to suppress transitions for a frame, because the switch changed `position` as well
     * as width and the panel jumped from below the header to the top of the viewport before sliding.
     * With the panel staying absolutely positioned there is nothing left that cannot be
     * interpolated, so the switch is left to animate like any other change.
     */

    #switchTimer: number | undefined

    /**
     * Holds the *panel* still while the mode changes, and nothing else.
     *
     * The panel is invisible at both ends of a mode switch - a closed overlay surface on one side,
     * a column panel on the other - but the CSS that makes it invisible is transitioned, so on the
     * way into overlay mode it fades out over 180ms. `position` flips to `fixed` in the first frame
     * of that fade, at full opacity, and the panel is seen jumping from under the header to the top
     * of the viewport before it disappears. Measured: `top:55 w:250` to `top:0 w:390` at opacity
     * 1.00, which is exactly the jump this component has now produced twice.
     *
     * ⚠️ Scoped to the panel and the scrim, deliberately. An earlier version killed every
     * transition under the root, which took the column's own width animation and the rows with it -
     * that is what made the whole thing pop rather than close. The root's width is left alone, so
     * the column still slides shut while the panel simply stops being drawn.
     */
    #switchModeWithoutAnimatingPanel(apply: () => void): void {
        this.#root.classList.add("vtd-sidebar-switching")
        apply()
        // Force the style recalculation now, so the new values are what any later transition
        // starts from rather than being picked up at the next paint
        void this.#root.offsetWidth
        clearTimeoutHelper(this.#switchTimer)
        const release = () => { this.#root.classList.remove("vtd-sidebar-switching") }
        requestFrame(() => { requestFrame(release) })
        // rAF does not tick in a background tab, and the class would stay on forever
        this.#switchTimer = setTimeoutHelper(release, 100)
    }

    /** Re-reads the breakpoint and writes the answer into the shared state */
    #handleMediaChange = () => {
        const overlay = this.#media?.matches ?? false
        if (overlay == this.#navState().overlay && this.#root.classList.contains("vtd-sidebar-overlay") == overlay) {
            return
        }
        this.#switchModeWithoutAnimatingPanel(() => {
            // `open` is carried across the switch rather than cleared. It means nothing while the
            // sidebar is a column - every rule that reads it also requires `.vtd-sidebar-overlay`,
            // and `isOpen()` answers false - so keeping it costs nothing and is what a reader
            // expects: widening and narrowing the window again is not an interaction with the
            // panel, so it should not close what they opened.
            this.#setNavState({overlay})
            this.#syncOverlay()
        })
    }

    /** Escape closes the panel, which is what every other dismissible surface here does */
    #handleKeydown = (event: KeyboardEvent) => {
        const state = this.#navState()
        if (event.key == "Escape" && state.overlay && state.open) {
            event.preventDefault()
            this.close()
        }
    }

    /**
     * Whatever had focus when the panel opened, so closing can give it back.
     *
     * Recorded rather than assumed to be `Navbar`'s control: this component does not know what
     * opened it, and a consumer's own button is just as likely. Reading `activeElement` answers
     * the question without either side having to know about the other.
     */
    #returnFocusTo: HTMLElement | undefined

    /** Every focusable thing inside the panel, in tab order */
    #focusablesInPanel(): HTMLElement[] {
        const selector = "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"
        return [...this.#panel.querySelectorAll(selector)]
            .filter(el => (el as HTMLElement).checkVisibility({checkVisibilityCSS: true})) as HTMLElement[]
    }

    /**
     * Tab stays inside an open overlay panel.
     *
     * The page behind is covered by the scrim and cannot be reached with a pointer, so letting Tab
     * walk into it would put the reader somewhere they can see but cannot click. This is the one
     * thing a `<dialog>` would have given for free, and the only one - `Escape`, the scrim and
     * `inert` on the closed panel are all already here.
     */
    #handleFocusTrap = (event: KeyboardEvent) => {
        if (event.key != "Tab" || !this.isOpen()) {
            return
        }
        const focusables = this.#focusablesInPanel()
        if (focusables.length == 0) {
            return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (!this.#panel.contains(active)) {
            event.preventDefault()
            ;(event.shiftKey ? last : first).focus()
        } else if (event.shiftKey && active == first) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && active == last) {
            event.preventDefault()
            first.focus()
        }
    }

    /** Opens the overlay panel. Does nothing while the sidebar is a column */
    open(): void {
        if (!this.#navState().overlay) {
            return
        }
        this.#setNavState({open: true})
        this.#syncOverlay()
    }

    /** Closes the overlay panel */
    close(): void {
        this.#setNavState({open: false})
        this.#syncOverlay()
    }

    /** Opens the overlay panel if it is closed, closes it if it is open */
    toggle(): void {
        if (this.#navState().open) { this.close() } else { this.open() }
    }

    /** Is the overlay panel showing? Always false while the sidebar is a column */
    isOpen(): boolean {
        const state = this.#navState()
        return state.overlay && state.open
    }

    /** Is the sidebar currently an overlay rather than a column? */
    isOverlay(): boolean {
        return this.#navState().overlay
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
        const treeEl: HTMLElement = <Tree
            class="vtd-sidebar-tree"
            ariaLabel={this.#attrs.ariaLabel}
            nodes={this.#toNodes(items)}
            onToggle={this.#handleToggle}/>
        this.#tree = getComponent<Tree>(treeEl)
        // `setChildren`, never `body.replaceChildren(...)` - see core/dom-lifecycle.ts. Every row
        // in here is a `NavLink`, which does all of its work in `mount()`: this is the call site
        // that bug was found on.
        setChildren(this, body, [treeEl])
        this.#groups = [...this.#root.querySelectorAll(".vtd-tree-node")] as HTMLElement[]
        this.#syncActiveGroup()
    }

    override mount() {
        addGlobalListener("popstate", this.#syncActiveGroup)
        addGlobalListener("locationchange", this.#syncActiveGroup)
        this.#syncActiveGroup()

        const breakpoint = this.#attrs.overlayBelow ?? "48em"
        if (breakpoint) {
            this.#media = matchMediaHelper(`(max-width: ${breakpoint})`)
            this.#media?.addEventListener("change", this.#handleMediaChange)
            this.#handleMediaChange()
        }
        // Escape is listened for on the document rather than the panel: the reader may well have
        // focus back on the menu control that opened it, which is outside this component entirely
        document.addEventListener("keydown", this.#handleKeydown)
        document.addEventListener("keydown", this.#handleFocusTrap)
        // A second control for the same state - Navbar's menu button - writes straight to the
        // shared object, so the panel has to follow the object rather than only its own methods
        this.#attrs.nav?.registerOnChangeListener(this.#syncOverlay, {hasVtKey: this})
    }

    override unmount() {
        removeGlobalListener("popstate", this.#syncActiveGroup)
        removeGlobalListener("locationchange", this.#syncActiveGroup)
        this.#media?.removeEventListener("change", this.#handleMediaChange)
        clearTimeoutHelper(this.#switchTimer)
        document.removeEventListener("keydown", this.#handleKeydown)
        document.removeEventListener("keydown", this.#handleFocusTrap)
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
    #buildRow(item: SidebarItemType, divided: boolean): RenderableElements {
        const content: RenderableElements[] = [
            item.icon ? <span class="vtd-sidebar-icon">{item.icon}</span> : null,
            <span class="vtd-sidebar-label">{item.label}</span>,
            item.trailing ? <span class="vtd-sidebar-trailing">{item.trailing}</span> : null,
        ]
        // The rule goes on the row rather than on the node wrapping it, so it spans the row the
        // reader sees; the wrapper also holds the group's children, which would put the line above
        // an open group's contents instead of above the group
        const divider = divided ? " vtd-sidebar-row-divided" : ""
        if (!item.to) {
            return <span class={`vtd-sidebar-row${divider}`}>{content}</span>
        }
        return <NavLink
            to={item.to}
            spa={this.#attrs.spa}
            exact={this.#attrs.exact}
            class={`vtd-sidebar-row vtd-sidebar-link${divider}`}>{content}</NavLink>
    }

    /** Maps this component's items onto the nodes `Tree` renders */
    #toNodes(items: SidebarItemType[]): TreeNodeType[] {
        return items.map((item, index) => ({
            key: item.key ?? item.to ?? String(item.label),
            label: this.#buildRow(item, item.dividerBefore === true && index > 0),
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
            mountStyles(sidebarCss, "vtd/Sidebar", "composite")
        }

        this.#tree = getComponent<Tree>(<Tree
            class="vtd-sidebar-tree"
            ariaLabel={attrs.ariaLabel}
            nodes={this.#toNodes(attrs.items)}
            onToggle={this.#handleToggle}/>)

        // tabindex="-1" so the panel can take focus when it opens without becoming a tab stop of
        // its own - the same thing the scrolling popup panels in this package do
        // Only ever visible in overlay mode, where the surface covers the screen and there is no
        // scrim left to tap. Always in the tree rather than built on demand: a control added and
        // removed as the mode changes cannot animate, and would land in the middle of the focus
        // order the trap walks.
        const closeControl: HTMLButtonElement = <button
            type="button"
            class="vtd-sidebar-close"
            aria-label={attrs.closeLabel}
            onClick={() => { this.close() }}><SidebarThemeOptions.closeSymbol/></button>

        this.#panel = <div class="vtd-sidebar-panel" tabindex={-1}>
            {/*
              * The close control shares a row with the header so that centring aligns the two.
              * `.vtd-sidebar-top` is `display:contents` outside overlay mode, so in a column the
              * header lays out exactly as it did before this row existed - the wrapper is not there
              * as far as layout is concerned.
              */}
            <div class="vtd-sidebar-top">
                {attrs.header ? <div class={`vtd-sidebar-header${attrs.collapsedHeader ? " vtd-sidebar-header-swaps" : ""}`}>
                    <div class="vtd-sidebar-header-full">{attrs.header}</div>
                    {attrs.collapsedHeader ? <div class="vtd-sidebar-header-rail">{attrs.collapsedHeader}</div> : null}
                </div> : null}
                {closeControl}
            </div>
            <div class="vtd-sidebar-body">{this.#tree}</div>
            {attrs.footer ? <div class="vtd-sidebar-footer">{attrs.footer}</div> : null}
            {attrs.profile ? this.#buildProfile(attrs.profile) : null}
            {attrs.collapsible ? this.#buildCollapseControl() : null}
            {/*
              * Inside the panel, not beside it. Against the rail the handle tracked the *gutter*,
              * so once collapsed it sat at 56px - and stayed there while hovering floated the panel
              * out to its full width, leaving the drag target stranded 200px from the edge it
              * resizes. Last, so it draws over its siblings without needing a z-index.
              */}
            {attrs.resizable ? this.#buildResizeHandle() : null}
        </div>
        // The scrim is always in the tree and only ever changes opacity, because an element that
        // stops rendering leaves its transition pending forever - see the Animation section of
        // CLAUDE.md. It is aria-hidden and not focusable: closing by tapping it is a pointer
        // convenience, and Escape is the keyboard's way out.
        const scrim: HTMLDivElement = <div
            class="vtd-sidebar-scrim"
            aria-hidden="true"
            onClick={() => { this.close() }}/>
        this.#root = passthroughAttrsToElement<HTMLElement>(<nav aria-label={attrs.ariaLabel} class="vtd-sidebar">
            {scrim}
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
