import { type EmptyAttrs, type FunctionComponent, type RenderableElements, setStylesheet } from "@velotype/velotype"

/**
 * Options to customize `<Toast/>` Theme
 */
export const ToastThemeOptions: {
    dismissSymbol: FunctionComponent<EmptyAttrs>
} = {
    dismissSymbol: function(){return "x"}
}

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
let toastContainer: HTMLDivElement | undefined

function ensureToastContainer(): HTMLDivElement {
    if (!areToastStylesMounted) {
        areToastStylesMounted = true
        setStylesheet(`
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
`, "vtd/Toast")
    }
    let container = toastContainer
    if (!container) {
        const newContainer: HTMLDivElement = <div class="vtd-toast-container"/>
        document.body.appendChild(newContainer)
        toastContainer = newContainer
        container = newContainer
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
    const type = options?.type || "info"
    const duration = options?.duration ?? 4000

    const toastElement: HTMLDivElement = <div class={`vtd-toast vtd-toast-${type}`} role="status">
        <div class="vtd-toast-body">{message}</div>
        <button type="button" class="vtd-toast-dismiss" aria-label={options?.dismissLabel} onClick={() => {
            toastElement.remove()
        }}><ToastThemeOptions.dismissSymbol/></button>
    </div>
    container.appendChild(toastElement)

    if (duration > 0) {
        globalThis.setTimeout(() => {
            toastElement.remove()
        }, duration)
    }
}
