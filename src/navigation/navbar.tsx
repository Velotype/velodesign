import {Component, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { ChildrenAttr, IdAttr, RenderableElements, RenderObject, StylePassthroughAttrs } from "../core/velotype.ts"
import type { SidebarNavState } from "./sidebar.tsx"

/**
 * Attrs type for `<Navbar/>` Component
 */
export type NavbarAttrsType = {
    /** Brand/logo content, shown at the far left */
    brand?: RenderableElements
    /**
     * Content shown immediately after `brand`, still on the left - for navigation that belongs
     * beside the brand rather than out with the account controls (a product switcher, a search
     * trigger). `children` stay pushed to the right regardless of whether this is set.
     */
    leading?: RenderableElements
    /**
     * A `Sidebar`'s shared state, which turns on a menu control at the start of the bar.
     *
     * The same `RenderObject` is handed to both components: `Sidebar` writes `overlay` from its own
     * breakpoint and this reads it to decide whether to draw the control at all, so the width is
     * stated in one place. Clicking flips `open`, which `Sidebar` is listening for.
     *
     * A `RenderObject` rather than the component itself because **JSX evaluates to the rendered
     * element, not the instance**, while TypeScript types it as the class - so taking a `Sidebar`
     * here would accept `sidebar={<Sidebar/>}` at compile time and fail on the first click. It also
     * keeps this component free of any runtime dependency on `Sidebar`.
     */
    sidebar?: RenderObject<SidebarNavState>
    /** Accessible name for the menu control, which is an icon. No default - the library doesn't assume a language */
    menuLabel?: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areNavbarStylesMounted = false

/**
 * A themed top navigation bar. Typically holds a `brand` slot plus `NavLink`s as children.
 *
 * Narrow viewports wrap. Given a `Sidebar`'s `nav` state it also draws a menu control, which is how
 * a sidebar is reached once it is too narrow to be a column of its own.
 *
 * **A class rather than a `FunctionComponent`, and only for `sidebar`**: the state is subscribed to,
 * and a subscription that is never removed is a leak. `mount`/`unmount` are the package's rule for
 * that, and `registerOnChangeListener`'s `hasVtKey` ties removal to this component's own lifecycle.
 */
export class Navbar extends Component<NavbarAttrsType> {
    #root: HTMLElement
    #menuButton: HTMLButtonElement | undefined
    #attrs: NavbarAttrsType

    /**
     * Reflects the shared state onto the one control that depends on it.
     *
     * A targeted attribute write rather than a re-render: `Navbar` holds the consumer's own
     * `children`, and rebuilding them on a state change that only concerns one button would discard
     * whatever they hold - the rule in "Interaction must only touch the DOM that actually changed".
     */
    #syncMenu = () => {
        const state = this.#attrs.sidebar?.get()
        if (!this.#menuButton || !state) {
            return
        }
        this.#menuButton.classList.toggle("vtd-navbar-menu-collapsed", !state.overlay)
        this.#menuButton.setAttribute("aria-expanded", state.open ? "true" : "false")
        this.#menuButton.classList.toggle("vtd-navbar-menu-open", state.open)
    }

    constructor(attrs: NavbarAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        mountNavbarStyles()

        if (attrs.sidebar) {
            const nav = attrs.sidebar
            this.#menuButton = <button
                type="button"
                aria-label={attrs.menuLabel}
                aria-expanded="false"
                class="vtd-navbar-menu vtd-navbar-menu-collapsed"
                onClick={() => { const s = nav.get(); nav.set({...s, open: !s.open}) }}>
                <span class="vtd-navbar-menu-icon" aria-hidden="true"/>
            </button>
        }

        this.#root = passthroughAttrsToElement<HTMLElement>(<nav class="vtd-navbar">
            <div class="vtd-navbar-start">
                {this.#menuButton ?? null}
                {attrs.brand ? <div class="vtd-navbar-brand">{attrs.brand}</div> : null}
                {attrs.leading ? <div class="vtd-navbar-leading">{attrs.leading}</div> : null}
            </div>
            <div class="vtd-navbar-items">{children}</div>
        </nav>, attrs)
    }

    override mount() {
        // triggerOnRegistration, because the sidebar resolves its breakpoint on its own mount and
        // this button has to catch up with whatever it decided
        this.#attrs.sidebar?.registerOnChangeListener(this.#syncMenu, {hasVtKey: this, triggerOnRegistration: true})
        this.#syncMenu()
    }

    override render(): HTMLElement {
        return this.#root
    }
}

/** Stylesheet for `<Navbar/>`, mounted once on first construction */
const navbarCss: string = `
.vtd-navbar{
width:100%;
box-sizing:border-box;
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
padding:0.75em 1em;
border-block-end:1px solid var(--background-4);
}
.vtd-navbar-start{
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
` +
/* The auto margin lives here rather than on the brand, so brand and leading group together on
   the left and children are pushed right whether or not leading is set. */
`
margin-inline-end:auto;
}
.vtd-navbar-brand{
font-weight:bold;
}
.vtd-navbar-leading,.vtd-navbar-items{
display:flex;
flex-wrap:wrap;
align-items:center;
gap:1em;
}
` +
/*
 * The menu control: three bars drawn in CSS, like every other glyph the package draws itself. It
 * carries the 24px touch floor because it is the only way to the navigation at the widths it
 * appears at, and it is `hidden` until the sidebar says it is an overlay.
 */
`
.vtd-navbar-menu{
display:inline-flex;
align-items:center;
justify-content:center;
min-width:24px;
min-height:24px;
padding:0.25em;
background:transparent;
border:1px solid transparent;
border-radius:0.25rem;
cursor:pointer;
color:inherit;
}
.vtd-navbar-menu:hover{background-color:var(--background-2);}
` +
/*
 * The control shrinks and fades rather than being un-rendered, which is the same thing `Sidebar`'s
 * rail does to its labels and for the same reason: `display:none` cannot be transitioned, so it
 * pops in and out in the frame the breakpoint is crossed while the sidebar beside it spends 180ms
 * animating.
 *
 * ⚠️ `hidden` is no use here at all, and not only because it cannot animate. The attribute works
 * through a *user-agent* rule, `[hidden]{display:none}`, and any author `display` declaration beats
 * the UA sheet whatever its specificity - so the `display:inline-flex` above silently un-hid it and
 * the control showed at every width. It read as set, it was set, and it did nothing.
 *
 * `visibility` is what keeps a zero-width control out of the tab order, and it flips at the *end*
 * of the transition on the way out so the fade is seen, and immediately on the way in.
 *
 * The negative margin cancels `.vtd-navbar-start`'s 1em gap: a flex item of zero width still has a
 * gap beside it, so without this the brand sits an em further right at wide viewports than narrow.
 */
`
.vtd-navbar-menu{
overflow:hidden;
opacity:1;
max-width:3em;
transition:opacity 0.18s ease-in-out, max-width 0.18s ease-in-out, min-width 0.18s ease-in-out, margin-inline-end 0.18s ease-in-out, padding 0.18s ease-in-out, visibility 0s linear 0s;
}
.vtd-navbar-menu-collapsed{
opacity:0;
max-width:0;
` +
/*
 * ⚠️ `min-width:0` is not optional, and it is this component's own touch-target floor it is undoing.
 * `min-width` beats `max-width`, so the 24px floor the control carries for a finger kept it 24px
 * wide while collapsed - an invisible control still taking its space at every desktop width.
 * Measured: opacity 0, and 24px of it.
 */
`
min-width:0;
min-height:0;
padding-inline:0;
border-inline-width:0;
margin-inline-end:-1em;
visibility:hidden;
transition:opacity 0.18s ease-in-out, max-width 0.18s ease-in-out, min-width 0.18s ease-in-out, margin-inline-end 0.18s ease-in-out, padding 0.18s ease-in-out, visibility 0s linear 0.18s;
}
@media (prefers-reduced-motion: reduce){
.vtd-navbar-menu,.vtd-navbar-menu-collapsed{transition:none;}
}
.vtd-navbar-menu-icon{
position:relative;
display:block;
width:1.1em;
height:2px;
background-color:currentcolor;
}
.vtd-navbar-menu-icon::before,.vtd-navbar-menu-icon::after{
content:"";
position:absolute;
left:0;
width:100%;
height:2px;
background-color:currentcolor;
}
.vtd-navbar-menu-icon::before{top:-0.35em;}
.vtd-navbar-menu-icon::after{top:0.35em;}
`

function mountNavbarStyles(): void {
    if (!areNavbarStylesMounted) {
        areNavbarStylesMounted = true
        mountStyles(navbarCss, "vtd/Navbar")
    }
}
