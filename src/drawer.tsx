import { type ChildrenAttr, Component, type EmptyAttrs, type FunctionComponent, type RenderableElements, setStylesheet } from "@velotype/velotype"
import { Button } from "./button.tsx"

/**
 * Options to customize `<Drawer/>` Component Theme
 */
export const DrawerThemeOptions: {
    closeSymbol: FunctionComponent<EmptyAttrs>
} = {
    closeSymbol: function(){return "x"}
}

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
        setStylesheet(`
.vtd-drawer{
position:fixed;
margin:0;
padding:1em;
border:none;
overflow:auto;
/*
 * The browser's own UA stylesheet caps an open (:modal) dialog at
 * max-width/max-height: calc((100% - 6px) - 2em) by default - lower-priority than any
 * author rule, but only actually overridden if an author rule sets max-width/max-height
 * explicitly. Leaving it unset here (rather than just not fighting it) left every placement
 * a consistent ~2em short of the true edge, which is exactly the "not full edge" symptom -
 * explicit "none" cancels it so each placement's own width/height below is unclamped.
 */
max-width:none;
max-height:none;
}
.vtd-drawer::backdrop{
background:rgba(75,75,75,0.6);
backdrop-filter: blur(2px);
}
/*
 * Each placement sets its own max-width/max-height instead of sharing one blanket cap on
 * .vtd-drawer - a single max-width:90vw;max-height:90vh used to apply to every placement
 * regardless of axis, which clamped a left/right drawer's height to 90vh (instead of the full
 * 100vh edge-to-edge look height:100vh asks for) and, symmetrically, would have clamped a
 * top/bottom drawer's width to 90vw instead of the full 100vw edge.
 */
.vtd-drawer-position-left{inset-inline-start:0;inset-inline-end:auto;inset-block:0;height:100vh;width:min(24em,90vw);}
.vtd-drawer-position-right{inset-inline-end:0;inset-inline-start:auto;inset-block:0;height:100vh;width:min(24em,90vw);}
.vtd-drawer-position-top{inset-block-start:0;inset-block-end:auto;inset-inline:0;width:100vw;max-height:80vh;}
.vtd-drawer-position-bottom{inset-block-end:0;inset-block-start:auto;inset-inline:0;width:100vw;max-height:80vh;}
.vtd-drawer-enter-left{animation:vtd-drawer-in-left 0.2s ease-out;}
.vtd-drawer-enter-right{animation:vtd-drawer-in-right 0.2s ease-out;}
.vtd-drawer-enter-top{animation:vtd-drawer-in-top 0.2s ease-out;}
.vtd-drawer-enter-bottom{animation:vtd-drawer-in-bottom 0.2s ease-out;}
@keyframes vtd-drawer-in-left{from{transform:translateX(-100%);}to{transform:translateX(0);}}
@keyframes vtd-drawer-in-right{from{transform:translateX(100%);}to{transform:translateX(0);}}
@keyframes vtd-drawer-in-top{from{transform:translateY(-100%);}to{transform:translateY(0);}}
@keyframes vtd-drawer-in-bottom{from{transform:translateY(100%);}to{transform:translateY(0);}}
.vtd-drawer-separator{margin:0.5em 0;}
.vtd-drawer-inner{padding:0.5em;}
`, "vtd/Drawer")
    }

    /** The underlying `<dialog/>` element */
    #dialog: HTMLDialogElement

    /** Close the Drawer */
    close() {
        this.#dialog.close()
    }
    /** Show the Drawer */
    showModal() {
        this.#dialog.showModal()
    }

    /** Create a new `<Drawer/>` Component */
    constructor(attrs: DrawerAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        const placement = attrs.placement || "left"
        const enterFrom = attrs.enterFrom || placement
        this.#dialog = <dialog class={`vtd-drawer vtd-drawer-position-${placement} vtd-drawer-enter-${enterFrom}`} closedby="any">
            <div style={{display: "flex", alignItems: "center"}}>
                <span style={{marginRight: "auto"}}>{attrs.title}</span>
                <Button type="secondary" onClick={()=>{
                    this.#dialog.close()
                }}><DrawerThemeOptions.closeSymbol/></Button>
            </div>
            <hr class="vtd-drawer-separator"/>
            <div class="vtd-drawer-inner">{children}</div>
        </dialog>
    }

    /** Render this Component */
    override render(): HTMLDialogElement {
        return this.#dialog
    }
}
