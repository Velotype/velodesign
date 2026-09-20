import {passthroughAttrsToElement} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"
import type {IdAttr, RenderableElements, FunctionComponent, StylePassthroughAttrs, TargetedMouseEvent, ChildrenAttr} from "@velotype/velotype"
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
    /** onClick event handler */
    onClick?: (event: TargetedMouseEvent<HTMLButtonElement>, doneLoading?: () => void) => void,
    /** Should the button trigger a loading icon when clicked? */
    loadingOnClick?: boolean
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

    let spinnerElement: HTMLSpanElement | undefined
    if (attrs.loadingOnClick) {
        spinnerElement = <span class="vtd-button-spinner"><ButtonThemeOptions.loadingSymbol/></span>
    }
    const childrenWrapper: HTMLSpanElement = <span>{children}</span>
    return passthroughAttrsToElement<HTMLButtonElement>(<button type="button"
        class={`vtd-button vtd-button-${attrs.type||"primary"}`}
        tabindex={0}
        aria-label={attrs.ariaLabel}
        disabled={attrs.disabled}
        onClick={(event: TargetedMouseEvent<HTMLButtonElement>) => {
            if (attrs.loadingOnClick && isLoading) {
                // Protect the button from being clicked while still loading
                return
            }
            if (attrs.onClick) {
                if (attrs.loadingOnClick) {
                    isLoading = true
                    if (spinnerElement) {
                        spinnerElement.style.visibility = "visible"
                    }
                    childrenWrapper.style.visibility = "hidden"
                    attrs.onClick(event, () => {
                        isLoading = false
                        if (attrs.loadingOnClick && spinnerElement) {
                            spinnerElement.style.visibility = "hidden"
                        }
                        childrenWrapper.style.visibility = "visible"
                    })
                } else {
                    attrs.onClick(event)
                }
            }
        }}>
        {childrenWrapper}
        {spinnerElement}
    </button>, attrs)
}
