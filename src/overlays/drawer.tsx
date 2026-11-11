/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type ChildrenAttr, Component, type RenderableElements} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { Button } from "../form/button.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"
import { animateDialog, MOTION } from "../core/motion.ts"

/**
 * Options to customize `<Drawer/>` Component Theme
 */
export const DrawerThemeOptions: {
    /** Content of the corner close button. Defaults to `CommonThemeOptions.closeSymbol` */
    closeSymbol: ThemeSymbol
} = themeOptions({closeSymbol: "closeSymbol"})

/**
 * An edge of the viewport - used both for where a `<Drawer/>` settles (`placement`) and which
 * direction its entrance animation travels from (`enterFrom`)
 */
export type DrawerPlacement = "left" | "right" | "top" | "bottom"

/**
 * Attrs type for `<Drawer/>` Component
 */
export type DrawerAttrsType = {
    /** Title content (usually a string) */
    title?: RenderableElements
    /** Which edge of the viewport the drawer is anchored to (default: `"left"`) */
    placement?: DrawerPlacement
    /**
     * Which direction the entrance animation slides in from. Defaults to `placement`, so the
     * drawer appears to enter from just outside the viewport edge it settles on - set this to a
     * different edge for a drawer that settles on one side but visibly travels in from another.
     */
    enterFrom?: DrawerPlacement
} & ChildrenAttr

/**
 * A panel that slides in from a viewport edge, over top of the page - like `Modal`, but for
 * side/top/bottom-anchored content (filters, detail views, mobile nav) rather than a centered dialog
 */
export class Drawer extends Component<DrawerAttrsType> {
    /** Mount this Component */
    override mount() {
        mountStyles(
`
.vtd-drawer{
position:fixed;
margin:0;
padding:1em;
border:none;
overflow:auto;
` +
/*
 * The browser's own UA stylesheet caps an open (:modal) dialog at
 * max-width/max-height: calc((100% - 6px) - 2em) by default - lower-priority than any
 * author rule, but only actually overridden if an author rule sets max-width/max-height
 * explicitly. Leaving it unset here (rather than just not fighting it) left every placement
 * a consistent ~2em short of the true edge, which is exactly the "not full edge" symptom -
 * explicit "none" cancels it so each placement's own width/height below is unclamped.
 */
`
max-width:none;
max-height:none;
}
.vtd-drawer::backdrop{
background:rgba(75,75,75,0.6);
backdrop-filter: blur(2px);
}
` +
/*
 * Each placement sets its own max-width/max-height instead of sharing one blanket cap on
 * .vtd-drawer - a single max-width:90vw;max-height:90vh used to apply to every placement
 * regardless of axis, which clamped a left/right drawer's height to 90vh (instead of the full
 * 100vh edge-to-edge look height:100vh asks for) and, symmetrically, would have clamped a
 * top/bottom drawer's width to 90vw instead of the full 100vw edge.
 */
`
.vtd-drawer-position-left{inset-inline-start:0;inset-inline-end:auto;inset-block:0;height:100vh;width:min(24em,90vw);}
.vtd-drawer-position-right{inset-inline-end:0;inset-inline-start:auto;inset-block:0;height:100vh;width:min(24em,90vw);}
.vtd-drawer-position-top{inset-block-start:0;inset-block-end:auto;inset-inline:0;width:100vw;max-height:80vh;}
.vtd-drawer-position-bottom{inset-block-end:0;inset-block-start:auto;inset-inline:0;width:100vw;max-height:80vh;}
.vtd-drawer-enter-left[open]{animation:vtd-drawer-in-left ${MOTION};}
.vtd-drawer-enter-right[open]{animation:vtd-drawer-in-right ${MOTION};}
.vtd-drawer-enter-top[open]{animation:vtd-drawer-in-top ${MOTION};}
.vtd-drawer-enter-bottom[open]{animation:vtd-drawer-in-bottom ${MOTION};}
` +
/* It leaves the way it came, and the backdrop fades in and out with it */
`
.vtd-drawer-enter-left.vtd-drawer-closing{animation:vtd-drawer-out-left ${MOTION} forwards;}
.vtd-drawer-enter-right.vtd-drawer-closing{animation:vtd-drawer-out-right ${MOTION} forwards;}
.vtd-drawer-enter-top.vtd-drawer-closing{animation:vtd-drawer-out-top ${MOTION} forwards;}
.vtd-drawer-enter-bottom.vtd-drawer-closing{animation:vtd-drawer-out-bottom ${MOTION} forwards;}
.vtd-drawer[open]::backdrop{animation:vtd-drawer-backdrop-in ${MOTION};}
.vtd-drawer.vtd-drawer-closing::backdrop{animation:vtd-drawer-backdrop-out ${MOTION} forwards;}
@keyframes vtd-drawer-in-left{from{transform:translateX(-100%);}to{transform:translateX(0);}}
@keyframes vtd-drawer-in-right{from{transform:translateX(100%);}to{transform:translateX(0);}}
@keyframes vtd-drawer-in-top{from{transform:translateY(-100%);}to{transform:translateY(0);}}
@keyframes vtd-drawer-in-bottom{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes vtd-drawer-out-left{from{transform:translateX(0);}to{transform:translateX(-100%);}}
@keyframes vtd-drawer-out-right{from{transform:translateX(0);}to{transform:translateX(100%);}}
@keyframes vtd-drawer-out-top{from{transform:translateY(0);}to{transform:translateY(-100%);}}
@keyframes vtd-drawer-out-bottom{from{transform:translateY(0);}to{transform:translateY(100%);}}
@keyframes vtd-drawer-backdrop-in{from{opacity:0;}to{opacity:1;}}
@keyframes vtd-drawer-backdrop-out{from{opacity:1;}to{opacity:0;}}
@media (prefers-reduced-motion: reduce){
.vtd-drawer,.vtd-drawer::backdrop,.vtd-drawer.vtd-drawer-closing,.vtd-drawer.vtd-drawer-closing::backdrop{animation:none;}
}
.vtd-drawer-separator{margin:0.5em 0;}
.vtd-drawer-inner{padding:0.5em;}
.vtd-drawer-close .vtd-icon{height:1.6em;margin-block:-0.3em;}
.vtd-drawer-close .vtd-icon path{stroke-width:1.6;}
`, "vtd/Drawer")
    }

    /** The underlying `<dialog/>` element */
    #dialog: HTMLDialogElement

    /** Opens and closes the dialog with its motion */
    #motion: {close: () => void, showModal: () => void}

    /** Close the Drawer */
    close() {
        this.#motion.close()
    }
    /** Show the Drawer */
    showModal() {
        this.#motion.showModal()
    }

    /** Create a new `<Drawer/>` Component */
    constructor(attrs: DrawerAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        const placement = attrs.placement || "left"
        const enterFrom = attrs.enterFrom || placement
        this.#dialog = <dialog class={`vtd-drawer vtd-drawer-position-${placement} vtd-drawer-enter-${enterFrom}`} closedby="any">
            <div style={{display: "flex", alignItems: "center"}}>
                <span style={{marginRight: "auto"}}>{attrs.title}</span>
                <Button type="secondary" class="vtd-drawer-close" onClick={()=>{
                    this.close()
                }}><DrawerThemeOptions.closeSymbol/></Button>
            </div>
            <hr class="vtd-drawer-separator"/>
            <div class="vtd-drawer-inner">{children}</div>
        </dialog>
        this.#motion = animateDialog(this.#dialog, "vtd-drawer-closing")
    }

    /** Render this Component */
    override render(): HTMLDialogElement {
        return this.#dialog
    }
}
