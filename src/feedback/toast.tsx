import { Component, getComponent, RenderObjectArray, replaceElementWithRoot } from "../core/velotype.ts"
import type { EmptyAttrs, RenderableElements } from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"
import { setTimeoutHelper } from "../core/utilities.ts"

/**
 * Options to customize `<Toast/>` Theme
 */
export const ToastThemeOptions: {
    /** Content of the dismiss button on each toast. Defaults to `CommonThemeOptions.closeSymbol` */
    closeSymbol: ThemeSymbol
} = themeOptions({closeSymbol: "closeSymbol"})

/**
 * Various types of Toasts
 */
export type ToastType = "info" | "success" | "warning" | "danger"

/**
 * Options for `showToast`
 */
export type ToastOptions = {
    /** What type of toast is this? (sets the color) */
    type?: ToastType
    /** Milliseconds before this toast auto-dismisses. `0` disables auto-dismiss (default: `4000`) */
    duration?: number
    /** Accessible label for the dismiss button. No default - the library doesn't assume a language; set this (e.g. to "Dismiss") to give screen reader users a description */
    dismissLabel?: string
}

let areToastStylesMounted = false
/**
 * The one shared stack every toast is added to, and the only reason it is a Component at all.
 *
 * `showToast` is an imperative function with no component of its own, so without this there would
 * be nothing to add and remove toasts *through* - and a toast's `message` is consumer content that
 * may hold components needing `mount()`/`unmount()`. See `core/dom-lifecycle.ts`.
 */
/** One visible toast, as data. The element is `#toasts`'s render function's business */
type ToastEntry = {
    message: RenderableElements
    type: ToastType
    dismissLabel?: string
}

class ToastContainer extends Component<EmptyAttrs> {
    /**
     * The toasts on screen, as a `RenderObjectArray`.
     *
     * This is the one list in the package that genuinely mutates a point at a time - one toast
     * arrives, another times out - rather than being recomputed whole, which is exactly what
     * `RenderObjectArray` is for. `push` and `delete` touch one element; nothing else on screen is
     * rebuilt, so a toast already fading in is not interrupted by a second one arriving.
     *
     * `delete` matches on object identity through `findIndex`, so every entry has to be its own
     * object - `showToast` builds a fresh one per call, and two identical toasts are still two
     * entries. It is also idempotent: dismissing one that already timed out finds nothing and does
     * nothing, which is what lets the timeout below stay unconditional.
     *
     * The wrapper element velotype puts around the list is `display:contents`, so the toasts stay
     * direct flex children of `.vtd-toast-container` and the column gap still applies to them.
     */
    #toasts: RenderObjectArray<ToastEntry> = new RenderObjectArray<ToastEntry>({
        renderFunction: (entry: ToastEntry) => <div class={`vtd-toast vtd-toast-${entry.type}`} role="status">
            <div class="vtd-toast-body">{entry.message}</div>
            <button type="button" class="vtd-toast-dismiss" aria-label={entry.dismissLabel} onClick={() => {
                this.dismiss(entry)
            }}><ToastThemeOptions.closeSymbol/></button>
        </div>
    })

    #root: HTMLDivElement = <div class="vtd-toast-container">{this.#toasts}</div>

    /** Put a toast on the page */
    add(entry: ToastEntry): void {
        this.#toasts.push(entry)
    }

    /** Take a toast off the page. A no-op if it is already gone. */
    dismiss(entry: ToastEntry): void {
        this.#toasts.delete(entry)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}

let toastContainer: ToastContainer | undefined

/** Stylesheet for `<Toast/>`, mounted once on first construction */
const toastCss: string = `
.vtd-toast-container{
position:fixed;
bottom:1em;
right:1em;
z-index:1000;
display:flex;
flex-direction:column;
gap:0.5em;
max-width:20em;
}
.vtd-toast{
display:flex;
align-items:flex-start;
gap:0.75em;
padding:0.75em 1em;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
box-shadow:0 2px 8px rgba(0,0,0,0.25);
animation:vtd-toast-in 0.15s ease-out;
}
@keyframes vtd-toast-in{
from{opacity:0;transform:translateY(0.5em);}
to{opacity:1;transform:translateY(0);}
}
.vtd-toast-info{background-color:var(--primary-2);border-color:var(--primary-6);}
.vtd-toast-success{background-color:var(--secondary-2);border-color:var(--secondary-6);}
.vtd-toast-warning{background-color:var(--warning-2);border-color:var(--warning-6);}
.vtd-toast-danger{background-color:var(--accent-2);border-color:var(--accent-6);}
.vtd-toast-body{flex-grow:1;}
.vtd-toast-dismiss{
flex-shrink:0;
cursor:pointer;
background:transparent;
border:none;
color:inherit;
font:inherit;
line-height:1;
padding:0.15em 0.4em;
border-radius:0.25rem;
}
.vtd-toast-dismiss:hover{background-color:var(--background-3);}
`

function ensureToastContainer(): ToastContainer {
    if (!areToastStylesMounted) {
        areToastStylesMounted = true
        mountStyles(toastCss, "vtd/Toast")
    }
    let container = toastContainer
    if (!container) {
        // Mounted through `replaceElementWithRoot` rather than appended to `document.body`
        // directly, because that is one of the three paths velotype dispatches the mount lifecycle
        // from - and a toast's `message` is arbitrary consumer content that may well be a
        // component. A bare `body.appendChild` would put the container on the page with no
        // Component behind it, leaving nothing to add and remove toasts *through*. See
        // `core/dom-lifecycle.ts`.
        const containerEl: HTMLDivElement = <ToastContainer/>
        const placeholder = document.createElement("div")
        document.body.appendChild(placeholder)
        replaceElementWithRoot(containerEl, placeholder)
        container = getComponent<ToastContainer>(containerEl)
        toastContainer = container
    }
    return container
}

/**
 * Shows a transient notification message, stacked with any other currently-visible toasts.
 *
 * Unlike every other component in this library, this isn't placed in a JSX tree - just call
 * it directly (e.g. from a click handler) and it manages its own container, appended to
 * `document.body` on first use.
 */
export function showToast(message: RenderableElements, options?: ToastOptions): void {
    const container = ensureToastContainer()
    const entry: ToastEntry = {
        message,
        type: options?.type || "info",
        dismissLabel: options?.dismissLabel
    }
    container.add(entry)

    const duration = options?.duration ?? 4000
    if (duration > 0) {
        // Unconditional, because dismissing a toast the reader already closed finds nothing in the
        // array and does nothing - there is no double-removal to guard against.
        setTimeoutHelper(() => {
            container.dismiss(entry)
        }, duration)
    }
}
