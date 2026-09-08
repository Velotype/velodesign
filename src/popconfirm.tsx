import { type ChildrenAttr, Component, type EmptyAttrs, type FunctionComponent, passthroughAttrsToElement, type RenderableElements, setStylesheet } from "@velotype/velotype"
import type { IdAttr, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"

/**
 * Options to customize `<Popconfirm/>` Component Theme
 */
export const PopconfirmThemeOptions: {
    confirmSymbol: FunctionComponent<EmptyAttrs>
    cancelSymbol: FunctionComponent<EmptyAttrs>
} = {
    confirmSymbol: function(){return "✓"},
    cancelSymbol: function(){return "✕"}
}

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
 */
export class Popconfirm extends Component<PopconfirmAttrsType> {
    /** Wraps the trigger and the bubble */
    #wrapper: HTMLSpanElement
    /** The positioned confirmation bubble */
    #bubble: HTMLDivElement
    /** Whatever had focus just before the bubble opened (the trigger, if it was activated by
     * keyboard), so `Escape` can restore it - not built on `<dialog>` (see the class doc
     * comment), so closing via script would otherwise leave focus stranded in the hidden bubble */
    #previouslyFocusedEl: HTMLElement | null = null
    /** Attrs captured at construction, read by `#handleDocumentClick` */
    #attrs: PopconfirmAttrsType

    /** Close the bubble */
    #close = (restoreFocus = false) => {
        this.#bubble.classList.remove("vtd-popconfirm-open")
        if (restoreFocus) {
            this.#previouslyFocusedEl?.focus()
        }
    }

    /** Open/close the bubble */
    #toggle = () => {
        if (!this.#bubble.classList.contains("vtd-popconfirm-open")) {
            this.#previouslyFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null
        }
        this.#bubble.classList.toggle("vtd-popconfirm-open")
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
    }

    /** Unmount this Component */
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    /** Create a new `<Popconfirm/>` Component */
    constructor(attrs: PopconfirmAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        if (!arePopconfirmStylesMounted) {
            arePopconfirmStylesMounted = true
            setStylesheet(`
.vtd-popconfirm{position:relative;display:inline-block;}
.vtd-popconfirm-trigger{cursor:pointer;display:inline-block;}
.vtd-popconfirm-content{
display:none;
position:absolute;
top:100%;
left:0;
z-index:1000;
margin-block-start:0.4em;
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

        this.#bubble = <div class="vtd-popconfirm-content">
            <div class="vtd-popconfirm-title">{attrs.title}</div>
            <div class="vtd-popconfirm-actions">
                <Button type="text" onClick={() => { this.#close() }}>{attrs.cancelButtonChildren || <PopconfirmThemeOptions.cancelSymbol/>}</Button>
                <Button type="danger" onClick={() => { attrs.onConfirm(); this.#close() }}>{attrs.confirmButtonChildren || <PopconfirmThemeOptions.confirmSymbol/>}</Button>
            </div>
        </div>

        this.#wrapper = <span class="vtd-popconfirm" onKeyDown={this.#handleKeyDown}>
            <span class="vtd-popconfirm-trigger" onClick={() => { this.#toggle() }}>{children}</span>
            {this.#bubble}
        </span>

        passthroughAttrsToElement<HTMLSpanElement>(this.#wrapper, attrs)
    }

    /** Render this Component */
    override render(): HTMLSpanElement {
        return this.#wrapper
    }
}
