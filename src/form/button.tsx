/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type {IdAttr, RenderableElements, FunctionComponent, StylePassthroughAttrs, TargetedMouseEvent, ChildrenAttr} from "../core/velotype.ts"
import { Spinner } from "../feedback/spinner.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Button/>` Component Theme
 */
export const ButtonThemeOptions: {
    /** Shown in place of the button's content while `onClick` is loading. No counterpart elsewhere in the package, so it stays local */
    loadingSymbol: ThemeSymbol
} = themeOptions({}, {
    loadingSymbol: function(){return <Spinner size="1em"/>}
})

/**
 * The shortest time, in ms, a button stays busy after a click that does work (`onClick` taking
 * `doneLoading`), even when the work finishes sooner - a double click on a quick response still
 * lands on a busy button, and the spinner doesn't flash. A button can set its own (`minLoadingMs`).
 */
const MIN_LOADING_MS = 500

/**
 * Various types of `<Button/>`s
 */
export type ButtonType = "primary" | "secondary" | "warning" | "danger" | "text"
/**
 * Attrs type for `<Button/>` Component
 */
export type ButtonAttrsType = {
    /** Is the button disabled? */
    disabled?: boolean,
    /** What type of button is this? (set the color) */
    type?: ButtonType,
    /**
     * onClick event handler. A handler that takes `doneLoading` is doing work (a request): the
     * button is busy from the click until it calls `doneLoading()` - a spinner in place of its
     * content, and further clicks ignored - unless `loadingOnClick` is false. An async handler
     * also finishes when its promise settles, so one that throws before `doneLoading()` doesn't
     * leave the button busy
     */
    onClick?: (event: TargetedMouseEvent<HTMLButtonElement>, doneLoading?: () => void) => void,
    /**
     * Busy while `onClick` works: on by default for a handler that takes `doneLoading`, off for
     * one that doesn't. Set it to force either
     */
    loadingOnClick?: boolean
    /** The shortest busy time after a click, in ms, even if the work finishes sooner (default 500) */
    minLoadingMs?: number
    /**
     * Accessible name for the button. No default - the library doesn't assume a language.
     *
     * Only needed when the button's own content doesn't already name it: a button whose children
     * are text takes its accessible name from that text, but one whose children are a symbol
     * (`DataTable`'s column-visibility button, say) has no name at all without this.
     */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Keep track of if Button styles are mounted (boolean lookup here is lighter weight than Map check)
 */
let areButtonStylesMounted = false

/**
 * An interactable Button
 */
export const Button: FunctionComponent<ButtonAttrsType> = function(attrs: ButtonAttrsType, children: RenderableElements[]): HTMLButtonElement {
    if (!areButtonStylesMounted) {
        areButtonStylesMounted = true
        mountStyles(`
.vtd-button{
position:relative;
padding:0.25rem 0.5rem;
` +
/*
 * A floor, not a size: every button with a word in it is already wider than this. It is the
 * icon-only ones that need it - Pagination's prev/next, Calendar's month arrows and Carousel's
 * navigation all draw a single narrow glyph and measured 23px across, one pixel under what
 * WCAG 2.2 SC 2.5.8 asks. See the touch target note in CLAUDE.md for why this is in px.
 */
`
min-width:24px;
min-height:24px;
border-radius:0.25rem;
cursor:pointer;
display:inline-block;
text-align:center;
text-decoration:none;
user-select:none;
vertical-align:middle;
transition:color 0.25s ease-in-out, background-color 0.25s ease-in-out, border 0.25s ease-in-out;
}

.vtd-button-primary{background-color:var(--primary);border:1px solid var(--primary-5);}
.vtd-button-primary:hover{background-color:var(--primary-2);border:1px solid var(--primary-7);}
.vtd-button-primary:active{background-color:var(--primary-6);}
.vtd-button-secondary{background-color:var(--secondary);border:1px solid var(--secondary-5);}
.vtd-button-secondary:hover{background-color:var(--secondary-2);border:1px solid var(--secondary-7);}
.vtd-button-secondary:active{background-color:var(--secondary-6);}
.vtd-button-warning{background-color:var(--warning);border:1px solid var(--warning-5);}
.vtd-button-warning:hover{background-color:var(--warning-2);border:1px solid var(--warning-7);}
.vtd-button-warning:active{background-color:var(--warning-6);}
.vtd-button-danger{background-color:var(--accent);border:1px solid var(--accent-5);}
.vtd-button-danger:hover{background-color:var(--accent-2);border:1px solid var(--accent-7);}
.vtd-button-danger:active{background-color:var(--accent-6);}

.vtd-button-text{background-color:transparent;border:1px solid transparent;}
.vtd-button-text:hover{background-color:var(--background-2);}
.vtd-button-text:active{background-color:var(--background-5);}

.vtd-button:disabled{cursor:not-allowed;opacity:0.5;}
.vtd-button[aria-busy="true"]{cursor:progress;}

.vtd-button-spinner{
position:absolute;
top:50%;
left:50%;
transform:translate3d(-50%, -50%, 0);
display:inline-block;
visibility:hidden;
}
`, "vtd/Button")
    }

    /** If the Button is in loading state */
    let isLoading = false
    // A handler that takes doneLoading does work, so the button guards itself unless told not to
    const loadingOnClick = attrs.loadingOnClick ?? (attrs.onClick !== undefined && attrs.onClick.length >= 2)
    const minLoadingMs = attrs.minLoadingMs ?? MIN_LOADING_MS

    let spinnerElement: HTMLSpanElement | undefined
    if (loadingOnClick) {
        spinnerElement = <span class="vtd-button-spinner"><ButtonThemeOptions.loadingSymbol/></span>
    }
    const childrenWrapper: HTMLSpanElement = <span>{children}</span>
    return passthroughAttrsToElement<HTMLButtonElement>(<button type="button"
        class={`vtd-button vtd-button-${attrs.type||"primary"}`}
        tabindex={0}
        aria-label={attrs.ariaLabel}
        disabled={attrs.disabled}
        onClick={(event: TargetedMouseEvent<HTMLButtonElement>) => {
            if (loadingOnClick && isLoading) {
                // Protect the button from being clicked while still loading
                return
            }
            if (attrs.onClick) {
                if (loadingOnClick) {
                    isLoading = true
                    const button = event.currentTarget
                    // Busy, said to assistive tech too; still focusable, so a keyboard user keeps their place
                    button.setAttribute("aria-busy", "true")
                    button.setAttribute("aria-disabled", "true")
                    if (spinnerElement) {
                        spinnerElement.style.visibility = "visible"
                    }
                    childrenWrapper.style.visibility = "hidden"
                    const startedAt = Date.now()
                    let finished = false
                    const doneLoading = () => {
                        // Called once; a second call (a handler's finally after its own) changes nothing
                        if (finished) {return}
                        finished = true
                        setTimeout(() => {
                            isLoading = false
                            button.removeAttribute("aria-busy")
                            button.removeAttribute("aria-disabled")
                            if (spinnerElement) {
                                spinnerElement.style.visibility = "hidden"
                            }
                            childrenWrapper.style.visibility = "visible"
                        }, Math.max(0, startedAt + minLoadingMs - Date.now()))
                    }
                    // Declared void, so any handler fits; an async one returns its promise all the same
                    const working: unknown = attrs.onClick(event, doneLoading)
                    // An async handler is finished when it settles, however it ends - a request that
                    // throws before its doneLoading() must not leave the button busy for good
                    // (finally, not then: the handler's own error still surfaces as it would have)
                    if (working instanceof Promise) {working.finally(doneLoading)}
                } else {
                    attrs.onClick(event)
                }
            }
        }}>
        {childrenWrapper}
        {spinnerElement}
    </button>, attrs)
}
