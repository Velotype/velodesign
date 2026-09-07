import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Form/>` Component
 */
export type FormAttrsType = {
    /** Called on submit, after `preventDefault()` has already been applied */
    onSubmit?: (event: SubmitEvent) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areFormStylesMounted = false

/**
 * A themed layout wrapper around a native `<form/>` - lays out its `FormField` children
 * (or any other content) in a vertical stack and intercepts `submit` to prevent the
 * default full-page navigation
 */
export const Form: FunctionComponent<FormAttrsType> = function(attrs: FormAttrsType, children: RenderableElements[]): HTMLFormElement {
    if (!areFormStylesMounted) {
        areFormStylesMounted = true
        setStylesheet(`
.vtd-form{display:flex;flex-direction:column;gap:1em;}
`, "vtd/Form")
    }

    return passthroughAttrsToElement<HTMLFormElement>(<form class="vtd-form" onSubmit={(event: Event) => {
        event.preventDefault()
        attrs.onSubmit?.(event as SubmitEvent)
    }}>
        {children}
    </form>, attrs)
}

/**
 * Attrs type for `<FormField/>` Component
 */
export type FormFieldAttrsType = {
    /** Label shown above the field's control */
    label?: RenderableElements
    /** Validation error shown below the field's control */
    error?: RenderableElements
    /** Shows a required-field marker next to the label */
    required?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areFormFieldStylesMounted = false

/**
 * A label/control/error stack, wrapping any single form control (`TextBox`, `Select`,
 * `Slider`, ...) passed as `children` in a style consistent with the rest of `Form`
 */
export const FormField: FunctionComponent<FormFieldAttrsType> = function(attrs: FormFieldAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areFormFieldStylesMounted) {
        areFormFieldStylesMounted = true
        setStylesheet(`
.vtd-form-field{display:flex;flex-direction:column;gap:0.35em;}
.vtd-form-field-label{font-weight:bold;font-size:0.9em;}
.vtd-form-field-required{color:var(--accent);margin-inline-start:0.2em;}
.vtd-form-field-error{color:var(--accent-8);font-size:0.85em;}
`, "vtd/FormField")
    }

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-form-field">
        {attrs.label ? <label class="vtd-form-field-label">{attrs.label}{attrs.required ? <span class="vtd-form-field-required">*</span> : null}</label> : null}
        {children}
        {attrs.error ? <span class="vtd-form-field-error" role="alert">{attrs.error}</span> : null}
    </div>, attrs)
}
