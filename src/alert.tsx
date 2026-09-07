import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, EmptyAttrs, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Options to customize `<Alert/>` Component Theme
 */
export const AlertThemeOptions: {
    dismissSymbol: FunctionComponent<EmptyAttrs>
} = {
    dismissSymbol: function(){return "x"}
}

/**
 * Various types of `<Alert/>`s
 */
export type AlertType = "info" | "success" | "warning" | "danger"

/**
 * Attrs type for `<Alert/>` Component
 */
export type AlertAttrsType = {
    /** What type of alert is this? (sets the color) */
    type?: AlertType
    /** Optional title content shown above the body */
    title?: RenderableElements
    /** If set, a dismiss button is shown; called when it's clicked, just before the Alert removes itself from the DOM */
    onDismiss?: () => void
    /** Accessible label for the dismiss button, when shown. No default - the library doesn't assume a language; set this (e.g. to "Dismiss") to give screen reader users a description */
    dismissLabel?: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areAlertStylesMounted = false

/**
 * An inline message box used to draw attention to important information
 */
export const Alert: FunctionComponent<AlertAttrsType> = function(attrs: AlertAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areAlertStylesMounted) {
        areAlertStylesMounted = true
        setStylesheet(`
.vtd-alert{
width:100%;
box-sizing:border-box;
display:flex;
align-items:flex-start;
gap:0.75em;
padding:0.75em 1em;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
}
.vtd-alert-info{background-color:var(--primary-2);border-color:var(--primary-6);}
.vtd-alert-success{background-color:var(--secondary-2);border-color:var(--secondary-6);}
.vtd-alert-warning{background-color:var(--warning-2);border-color:var(--warning-6);}
.vtd-alert-danger{background-color:var(--accent-2);border-color:var(--accent-6);}
.vtd-alert-body{flex-grow:1;}
.vtd-alert-title{font-weight:bold;margin-block-end:0.25em;}
.vtd-alert-dismiss{
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
.vtd-alert-dismiss:hover{background-color:var(--background-3);}
`, "vtd/Alert")
    }

    const alertElement: HTMLDivElement = <div class={`vtd-alert vtd-alert-${attrs.type||"info"}`} role="alert">
        <div class="vtd-alert-body">
            {attrs.title && <div class="vtd-alert-title">{attrs.title}</div>}
            <div>{children}</div>
        </div>
        {attrs.onDismiss && <button type="button" class="vtd-alert-dismiss" aria-label={attrs.dismissLabel} onClick={() => {
            attrs.onDismiss?.()
            alertElement.remove()
        }}><AlertThemeOptions.dismissSymbol/></button>}
    </div>
    return passthroughAttrsToElement<HTMLDivElement>(alertElement, attrs)
}
