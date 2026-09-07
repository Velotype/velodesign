import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Placement of a `<Popover/>`'s bubble, relative to its trigger content
 */
export type PopoverPlacement = "top" | "bottom" | "left" | "right"

/**
 * Attrs type for `<Popover/>` Component
 */
export type PopoverAttrsType = {
    /** Content that opens the popover when clicked (can itself be a real `Button`/`Link`/etc.) */
    trigger: RenderableElements
    /** Content shown inside the popover bubble */
    content: RenderableElements
    /** Which side of the trigger to show the bubble on (default: `"bottom"`) */
    placement?: PopoverPlacement
} & IdAttr & StylePassthroughAttrs

let arePopoverStylesMounted = false

/**
 * Wraps `trigger` with a themed popover bubble of rich, click-triggered content.
 *
 * Unlike `Tooltip` (CSS-only `:hover`/`:focus-within`, for a short hint), `Popover` opens on
 * click and can hold arbitrary interactive content.
 *
 * This is NOT built on native `<details>`/`<summary>` like `Menu`/`Accordion` - nesting a
 * genuinely interactive element (a `Button`, a native `<button>`/`<a>`) inside a `<summary>`
 * silently blocks the browser's default disclosure toggle (verified directly: a plain native
 * `<button>` inside `<summary>` never toggles its parent `<details>`, in every browser this
 * was checked in, while clicking elsewhere in the same `<summary>` toggles it fine). Since
 * `trigger` is explicitly meant to accept a real `Button`, open/close state is instead
 * tracked with a CSS class, toggled by an explicit click handler on the trigger and closed by
 * the same outside-click pattern `Menu`/`ContextMenu` use.
 */
export class Popover extends Component<PopoverAttrsType> {
    /** Wraps the trigger and the bubble */
    #wrapper: HTMLSpanElement
    /** The positioned content bubble */
    #bubble: HTMLDivElement

    /** Close the popover */
    #close = () => {
        this.#bubble.classList.remove("vtd-popover-open")
    }

    /** Open/close the popover */
    #toggle = () => {
        this.#bubble.classList.toggle("vtd-popover-open")
    }

    /** Close the popover if it's open and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#bubble.classList.contains("vtd-popover-open")) {
            return
        }
        if (event.target instanceof Node && this.#wrapper.contains(event.target)) {
            return
        }
        this.#close()
    }

    /** Mount this Component */
    override mount() {
        document.addEventListener("click", this.#handleDocumentClick)
    }

    /** Unmount this Component */
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    /** Create a new `<Popover/>` Component */
    constructor(attrs: PopoverAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!arePopoverStylesMounted) {
            arePopoverStylesMounted = true
            setStylesheet(`
.vtd-popover{position:relative;display:inline-block;}
.vtd-popover-trigger{cursor:pointer;display:inline-block;}
.vtd-popover-content{
display:none;
position:absolute;
z-index:1;
min-width:12em;
max-width:20em;
padding:0.75em 1em;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.15);
}
.vtd-popover-content.vtd-popover-open{display:block;}
.vtd-popover-top{bottom:100%;left:0;margin-block-end:0.4em;}
.vtd-popover-bottom{top:100%;left:0;margin-block-start:0.4em;}
.vtd-popover-left{right:100%;top:0;margin-inline-end:0.4em;}
.vtd-popover-right{left:100%;top:0;margin-inline-start:0.4em;}
`, "vtd/Popover")
        }

        const placement = attrs.placement || "bottom"
        this.#bubble = <div class={`vtd-popover-content vtd-popover-${placement}`}>{attrs.content}</div>

        this.#wrapper = <span class="vtd-popover">
            <span class="vtd-popover-trigger" onClick={() => { this.#toggle() }}>{attrs.trigger}</span>
            {this.#bubble}
        </span>

        passthroughAttrsToElement<HTMLSpanElement>(this.#wrapper, attrs)
    }

    /** Render this Component */
    override render(): HTMLSpanElement {
        return this.#wrapper
    }
}
