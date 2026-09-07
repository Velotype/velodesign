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
 * Which edge of the viewport a `<Drawer/>` slides in from
 */
export type DrawerPlacement = "left" | "right" | "top" | "bottom"

/**
 * Attrs type for `<Drawer/>` Component
 */
export type DrawerAttrsType = {
    /** Title content (usually a string) */
    title?: RenderableElements
    /** Which edge to slide in from (default: `"right"`) */
    placement?: DrawerPlacement
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
max-width:90vw;
max-height:90vh;
border:none;
overflow:auto;
}
.vtd-drawer::backdrop{
background:rgba(75,75,75,0.6);
backdrop-filter: blur(2px);
}
.vtd-drawer-left{inset-inline-start:0;inset-block:0;height:100vh;width:min(24em,90vw);animation:vtd-drawer-in-left 0.2s ease-out;}
.vtd-drawer-right{inset-inline-end:0;inset-block:0;height:100vh;width:min(24em,90vw);animation:vtd-drawer-in-right 0.2s ease-out;}
.vtd-drawer-top{inset-block-start:0;inset-inline:0;width:100vw;max-height:80vh;animation:vtd-drawer-in-top 0.2s ease-out;}
.vtd-drawer-bottom{inset-block-end:0;inset-inline:0;width:100vw;max-height:80vh;animation:vtd-drawer-in-bottom 0.2s ease-out;}
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
        const placement = attrs.placement || "right"
        this.#dialog = <dialog class={`vtd-drawer vtd-drawer-${placement}`} closedby="any">
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
