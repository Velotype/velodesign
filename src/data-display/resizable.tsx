import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Resizable/>` Component
 */
export type ResizableAttrsType = {
    /** Which edge the drag handle resizes (default: `"right"`) */
    direction?: "right" | "bottom"
    /** Starting CSS size along the resize axis (default: `"16em"`) */
    initialSize?: string
    /** Minimum size in px */
    minSize?: number
    /** Maximum size in px */
    maxSize?: number
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areResizableStylesMounted = false

/**
 * Wraps `children` in a container with a draggable edge handle that resizes it.
 *
 * The drag listeners are added to `document` only for the duration of an active drag
 * (added in the handle's `onPointerDown`, removed on `pointerup`) rather than for the whole
 * component lifecycle, so there's no need for `mount()`/`unmount()` here.
 */
export class Resizable extends Component<ResizableAttrsType> {
    /** The resizable container */
    #wrapper: HTMLDivElement

    /** Create a new `<Resizable/>` Component */
    constructor(attrs: ResizableAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areResizableStylesMounted) {
            areResizableStylesMounted = true
            setStylesheet(`
.vtd-resizable{position:relative;overflow:auto;}
.vtd-resizable-handle{position:absolute;background-color:transparent;}
.vtd-resizable-handle:hover,.vtd-resizable-handle-active{background-color:var(--primary-6);}
.vtd-resizable-handle-right{top:0;right:0;bottom:0;width:0.4em;cursor:ew-resize;}
.vtd-resizable-handle-bottom{left:0;right:0;bottom:0;height:0.4em;cursor:ns-resize;}
`, "vtd/Resizable")
        }

        const direction = attrs.direction || "right"
        const sizeProperty: "width" | "height" = direction == "right" ? "width" : "height"

        this.#wrapper = <div class="vtd-resizable" style={{[sizeProperty]: attrs.initialSize || "16em"}}>
            {children}
            <div
                class={`vtd-resizable-handle vtd-resizable-handle-${direction}`}
                onPointerDown={(event: PointerEvent) => {
                    event.preventDefault()
                    const startPos = direction == "right" ? event.clientX : event.clientY
                    const startSize = direction == "right" ? this.#wrapper.offsetWidth : this.#wrapper.offsetHeight
                    const handleElement = event.currentTarget as HTMLElement
                    handleElement.classList.add("vtd-resizable-handle-active")

                    const handleMove = (moveEvent: PointerEvent) => {
                        const pos = direction == "right" ? moveEvent.clientX : moveEvent.clientY
                        let newSize = startSize + (pos - startPos)
                        if (attrs.minSize != undefined) { newSize = Math.max(attrs.minSize, newSize) }
                        if (attrs.maxSize != undefined) { newSize = Math.min(attrs.maxSize, newSize) }
                        this.#wrapper.style[sizeProperty] = `${newSize}px`
                    }
                    const handleUp = () => {
                        handleElement.classList.remove("vtd-resizable-handle-active")
                        document.removeEventListener("pointermove", handleMove)
                        document.removeEventListener("pointerup", handleUp)
                    }
                    document.addEventListener("pointermove", handleMove)
                    document.addEventListener("pointerup", handleUp)
                }}/>
        </div>

        passthroughAttrsToElement<HTMLDivElement>(this.#wrapper, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#wrapper
    }
}
