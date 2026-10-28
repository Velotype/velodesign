/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type ChildrenAttr, Component, passthroughAttrsToElement, type RenderableElements} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, StylePassthroughAttrs } from "../core/velotype.ts"
import { Button } from "../form/button.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Popconfirm/>` Component Theme
 */
export const PopconfirmThemeOptions: {
    /** Content of the confirm button. Defaults to `CommonThemeOptions.confirmSymbol` */
    confirmSymbol: ThemeSymbol
    /** Content of the cancel button. Defaults to `CommonThemeOptions.cancelSymbol` */
    cancelSymbol: ThemeSymbol
} = themeOptions({confirmSymbol: "confirmSymbol", cancelSymbol: "cancelSymbol"})

/**
 * Attrs type for `<Popconfirm/>` Component
 */
export type PopconfirmAttrsType = {
    /** Message shown inside the confirmation bubble */
    title: RenderableElements
    /** Confirm button content (default: `PopconfirmThemeOptions.confirmSymbol` - a plain checkmark, not English text, so the library doesn't assume a language) */
    confirmButtonChildren?: RenderableElements
    /** Cancel button content (default: `PopconfirmThemeOptions.cancelSymbol` - a plain "x", not English text, so the library doesn't assume a language) */
    cancelButtonChildren?: RenderableElements
    /** Called when the confirm button is clicked, just before the bubble closes */
    onConfirm: () => void
    /** Closes the bubble when the user clicks anywhere outside of it (default: `true`) */
    closeOnOutsideClick?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let arePopconfirmStylesMounted = false

/**
 * Wraps `children` (the trigger - typically a real `Button`, e.g. "Delete") with a small
 * inline "are you sure?" bubble, for confirming a destructive action without the weight of a
 * full `Modal`.
 *
 * Deliberately NOT built on native `<details>`/`<summary>` (like `Menu`/`Accordion`): nesting
 * a genuinely interactive element inside `<summary>` silently blocks the browser's default
 * disclosure toggle (see `Popover`'s doc comment for how this was verified) - a real problem
 * here specifically, since `children` is the whole point and is expected to be a real
 * `Button`. Open/close state is instead tracked with a CSS class, same as `Popover`.
 *
 * **The bubble opens in the top layer, placed beside its trigger in the viewport.** Positioned
 * inside its trigger, it was clipped by - or sent to the far end of - any scrolling ancestor: a
 * Delete in the last row of a `DataTable` that scrolls sideways opened its bubble out of sight,
 * below and to the right. Opening, it goes into the top layer (the `popover` attribute, where the
 * browser has it; `position:fixed` otherwise), takes the trigger's place in the viewport, flips
 * above it when there's no room below and shifts left when it would run off the right edge.
 * Layout is read once, at that moment - never in a continuous handler. A scroll or a resize closes
 * it rather than leaving it where the trigger used to be.
 */
export class Popconfirm extends Component<PopconfirmAttrsType> {
    /** Wraps the trigger and the bubble */
    #wrapper: HTMLSpanElement
    /** The positioned confirmation bubble */
    #bubble: HTMLDivElement
    /** What the bubble is placed beside */
    #trigger: HTMLSpanElement
    /** Whatever had focus just before the bubble opened (the trigger, if it was activated by
     * keyboard), so `Escape` can restore it - not built on `<dialog>` (see the class doc
     * comment), so closing via script would otherwise leave focus stranded in the hidden bubble */
    #previouslyFocusedEl: HTMLElement | null = null
    /** Attrs captured at construction, read by `#handleDocumentClick` */
    #attrs: PopconfirmAttrsType

    /** The bubble is in the top layer while open, where the browser supports `popover` */
    #inTopLayer = false

    /** Close the bubble */
    #close = (restoreFocus = false) => {
        if (!this.#bubble.classList.contains("vtd-popconfirm-open")) {
            return
        }
        this.#bubble.classList.remove("vtd-popconfirm-open")
        if (this.#inTopLayer) {
            this.#inTopLayer = false
            this.#bubble.hidePopover()
        }
        if (restoreFocus) {
            this.#previouslyFocusedEl?.focus()
        }
    }

    /** Open/close the bubble */
    #toggle = () => {
        if (this.#bubble.classList.contains("vtd-popconfirm-open")) {
            this.#close()
            return
        }
        this.#previouslyFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
        this.#bubble.classList.add("vtd-popconfirm-open")
        if (typeof this.#bubble.showPopover === "function") {
            this.#bubble.showPopover()
            this.#inTopLayer = true
        }
        this.#place()
    }

    /** Beside the trigger in the viewport: below it, or above when there's no room below; never off the right edge */
    #place() {
        const margin = 8
        const gap = 6
        const trigger = this.#trigger.getBoundingClientRect()
        const bubble = this.#bubble.getBoundingClientRect()
        let top = trigger.bottom + gap
        if (top + bubble.height > innerHeight - margin && trigger.top - gap - bubble.height >= margin) {
            top = trigger.top - gap - bubble.height
        }
        let left = trigger.left
        if (left + bubble.width > innerWidth - margin) {
            left = Math.max(margin, Math.min(trigger.right, innerWidth - margin) - bubble.width)
        }
        this.#bubble.style.top = `${Math.round(top)}px`
        this.#bubble.style.left = `${Math.round(left)}px`
    }

    /** The trigger moved out from under the bubble - a scroll anywhere, or a resize */
    #handleViewportChange = (event: Event) => {
        if (event.target instanceof Node && this.#bubble.contains(event.target)) {
            return
        }
        this.#close()
    }

    /** Escape closes the bubble, from anywhere inside it (trigger or bubble content) */
    #handleKeyDown = (event: KeyboardEvent) => {
        if (event.key == "Escape" && this.#bubble.classList.contains("vtd-popconfirm-open")) {
            event.preventDefault()
            this.#close(true)
        }
    }

    /** Close the bubble if it's open, outside-click closing is enabled, and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (this.#attrs.closeOnOutsideClick === false) {
            return
        }
        if (!this.#bubble.classList.contains("vtd-popconfirm-open")) {
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
        // Capture: a scroll in any scrolling ancestor, not only the page's
        document.addEventListener("scroll", this.#handleViewportChange, true)
        globalThis.addEventListener("resize", this.#handleViewportChange)
    }

    /** Unmount this Component */
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
        document.removeEventListener("scroll", this.#handleViewportChange, true)
        globalThis.removeEventListener("resize", this.#handleViewportChange)
    }

    /** Create a new `<Popconfirm/>` Component */
    constructor(attrs: PopconfirmAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        if (!arePopconfirmStylesMounted) {
            arePopconfirmStylesMounted = true
            mountStyles(`
.vtd-popconfirm{position:relative;display:inline-block;}
.vtd-popconfirm-trigger{cursor:pointer;display:inline-block;}
.vtd-popconfirm-content{
display:none;
position:fixed;
inset:auto;
z-index:1000;
margin:0;
color:var(--text);
min-width:14em;
padding:0.75em 1em;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.15);
}
.vtd-popconfirm-content.vtd-popconfirm-open{display:block;}
.vtd-popconfirm-title{margin-block-end:0.75em;}
.vtd-popconfirm-actions{display:flex;justify-content:end;gap:0.5em;}
`, "vtd/Popconfirm")
        }

        this.#bubble = <div class="vtd-popconfirm-content" popover="manual">
            <div class="vtd-popconfirm-title">{attrs.title}</div>
            <div class="vtd-popconfirm-actions">
                <Button type="text" onClick={() => { this.#close() }}>{attrs.cancelButtonChildren || <PopconfirmThemeOptions.cancelSymbol/>}</Button>
                <Button type="danger" onClick={() => { attrs.onConfirm(); this.#close() }}>{attrs.confirmButtonChildren || <PopconfirmThemeOptions.confirmSymbol/>}</Button>
            </div>
        </div>

        this.#trigger = <span class="vtd-popconfirm-trigger" onClick={() => { this.#toggle() }}>{children}</span>
        this.#wrapper = <span class="vtd-popconfirm" onKeyDown={this.#handleKeyDown}>
            {this.#trigger}
            {this.#bubble}
        </span>

        passthroughAttrsToElement<HTMLSpanElement>(this.#wrapper, attrs)
    }

    /** Render this Component */
    override render(): HTMLSpanElement {
        return this.#wrapper
    }
}
