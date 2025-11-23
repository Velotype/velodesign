import {passthroughAttrsToElement, setStylesheet} from "@velotype/velotype"
import type {IdAttr, RenderableElements, FunctionComponent, EmptyAttrs, StylePassthroughAttrs, TargetedMouseEvent, ChildrenAttr} from "@velotype/velotype"

/**
 * Options to customize `<Button/>` Component Theme
 */
export const ButtonThemeOptions: {
    spinner: FunctionComponent<EmptyAttrs>
} = {
    spinner: function(){return "..."}
}

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
}

/**
 * Keep track of if Button styles are mounted (boolean lookup here is lighter weight than Map check)
 */
let areButtonStylesMounted = false

/**
 * An interactable Button
 */
export const Button: FunctionComponent<ButtonAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr> = function(attrs: ButtonAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr, children: RenderableElements[]): HTMLButtonElement {
    if (!areButtonStylesMounted) {
        areButtonStylesMounted = true
        setStylesheet(`
.vtd-btn{
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

.vtd-btn-primary{background-color:var(--primary);border:1px solid var(--primary-5);}
.vtd-btn-primary:hover{background-color:var(--primary-2);border:1px solid var(--primary-7);}
.vtd-btn-primary:active{background-color:var(--primary-6);}
.vtd-btn-secondary{background-color:var(--secondary);border:1px solid var(--secondary-5);}
.vtd-btn-secondary:hover{background-color:var(--secondary-2);border:1px solid var(--secondary-7);}
.vtd-btn-secondary:active{background-color:var(--secondary-6);}
.vtd-btn-warning{background-color:var(--warning);border:1px solid var(--warning-5);}
.vtd-btn-warning:hover{background-color:var(--warning-2);border:1px solid var(--warning-7);}
.vtd-btn-warning:active{background-color:var(--warning-6);}
.vtd-btn-danger{background-color:var(--accent);border:1px solid var(--accent-5);}
.vtd-btn-danger:hover{background-color:var(--accent-2);border:1px solid var(--accent-7);}
.vtd-btn-danger:active{background-color:var(--accent-6);}

.vtd-btn-text{background-color:transparent;border:1px solid transparent;}
.vtd-btn-text:hover{background-color:var(--background-2);}
.vtd-btn-text:active{background-color:var(--background-5);}

.vtd-btn:disabled:hover{cursor:not-allowed;}
.vtd-btn:focus-visible{border:1px solid var(--accent);}

.vtd-btn-spinner{
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
        spinnerElement = <span class="vtd-btn-spinner"><ButtonThemeOptions.spinner/></span>
    }
    const childrenWrapper: HTMLSpanElement = <span>{children}</span>
    return passthroughAttrsToElement(<button type="button"
        class={`vtd-btn vtd-btn-${attrs.type||"primary"}`}
        tabindex={0}
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
    </button>, attrs) as HTMLButtonElement
}
