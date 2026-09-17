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
    /** Closes the popover when the user clicks anywhere outside of it (default: `true`) */
    closeOnOutsideClick?: boolean
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
    /** Whatever had focus just before the popover opened (the trigger, if it was activated by
     * keyboard), so `Escape` can restore it - there's no native dialog dismissal behavior here
     * (see the class doc comment for why this isn't a `<dialog>`), so closing via script would
     * otherwise just leave focus stranded inside the now-hidden bubble */
    #previouslyFocusedEl: HTMLElement | null = null
    /** Attrs captured at construction, read by `#handleDocumentClick` (see the `Command` doc note on why this can't just close over the constructor's `attrs` parameter) */
    #attrs: PopoverAttrsType

    /** Close the popover */
    #close = (restoreFocus = false) => {
        this.#bubble.classList.remove("vtd-popover-open")
        if (restoreFocus) {
            this.#previouslyFocusedEl?.focus()
        }
    }

    /** Open/close the popover */
    #toggle = () => {
        if (!this.#bubble.classList.contains("vtd-popover-open")) {
            this.#previouslyFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
        }
        this.#bubble.classList.toggle("vtd-popover-open")
    }

    /** Close the popover if it's open, outside-click closing is enabled, and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (this.#attrs.closeOnOutsideClick === false) {
            return
        }
        if (!this.#bubble.classList.contains("vtd-popover-open")) {
            return
        }
        if (event.target instanceof Node && this.#wrapper.contains(event.target)) {
            return
        }
        this.#close()
    }

    /** Escape closes the popover, from anywhere inside it (trigger or bubble content) - no
     * native behavior provides this since it's not built on `<dialog>`/`<details>` */
    #handleKeyDown = (event: KeyboardEvent) => {
        if (event.key == "Escape" && this.#bubble.classList.contains("vtd-popover-open")) {
            event.preventDefault()
            this.#close(true)
        }
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
        this.#attrs = attrs
        if (!arePopoverStylesMounted) {
            arePopoverStylesMounted = true
            setStylesheet(`
.vtd-popover{position:relative;display:inline-block;}
.vtd-popover-trigger{cursor:pointer;display:inline-block;}
.vtd-popover-content{
display:none;
position:absolute;
z-index:1000;
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

        this.#wrapper = <span class="vtd-popover" onKeyDown={this.#handleKeyDown}>
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
