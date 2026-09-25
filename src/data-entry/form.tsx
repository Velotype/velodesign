import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"

/**
 * Attrs type for `<Form/>` Component
 */
export type FormAttrsType = {
    /** Called on submit, after `preventDefault()` has already been applied */
    onSubmit?: (event: SubmitEvent) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/** Stylesheet for `<Form/>`, mounted once on first construction */
const formCss: string = `
.vtd-form{width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:1em;}
`

let areFormStylesMounted = false

/**
 * A themed layout wrapper around a native `<form/>` - lays out its `FormField` children
 * (or any other content) in a vertical stack and intercepts `submit` to prevent the
 * default full-page navigation
 */
export const Form: FunctionComponent<FormAttrsType> = function(attrs: FormAttrsType, children: RenderableElements[]): HTMLFormElement {
    if (!areFormStylesMounted) {
        areFormStylesMounted = true
        mountStyles(formCss, "vtd/Form")
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
    /** Guidance shown below the field's control, always - for explaining what a field is for. Distinct from `error`, which appears only when something is wrong */
    hint?: RenderableElements
    /** Validation error shown below the field's control */
    error?: RenderableElements
    /** Shows a required-field marker next to the label */
    required?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areFormFieldStylesMounted = false

/** Stylesheet for `<FormField/>`, mounted once on first construction */
const formFieldCss: string = `
.vtd-form-field{width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:0.35em;}
.vtd-form-field-label{font-weight:bold;font-size:0.9em;}
.vtd-form-field-required{color:var(--accent);margin-inline-start:0.2em;}
.vtd-form-field-hint{color:var(--background-6);font-size:0.85em;}
.vtd-form-field-error{color:var(--accent-8);font-size:0.85em;}
`

/**
 * A label/control/error stack, wrapping any single form control (`TextBox`, `Select`,
 * `Slider`, ...) passed as `children` in a style consistent with the rest of `Form`
 */
export const FormField: FunctionComponent<FormFieldAttrsType> = function(attrs: FormFieldAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areFormFieldStylesMounted) {
        areFormFieldStylesMounted = true
        mountStyles(formFieldCss, "vtd/FormField")
    }

    const seq = ++formFieldSequence
    const labelId = `vtd-ff-label-${seq}`
    const hintId = `vtd-ff-hint-${seq}`
    const errorId = `vtd-ff-error-${seq}`

    const label = attrs.label
        ? <label id={labelId} class="vtd-form-field-label">{attrs.label}{attrs.required ? <span class="vtd-form-field-required" aria-hidden="true">*</span> : null}</label>
        : null
    const hint = attrs.hint ? <span id={hintId} class="vtd-form-field-hint">{attrs.hint}</span> : null
    const error = attrs.error ? <span id={errorId} class="vtd-form-field-error" role="alert">{attrs.error}</span> : null

    const root = passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-form-field">
        {label}
        {children}
        {hint}
        {error}
    </div>, attrs)

    associateLabel(root, {label, labelId, hintId: hint ? hintId : null, errorId: error ? errorId : null, required: attrs.required})
    return root
}

/** Distinguishes one field's label, hint and error ids from the next one's */
let formFieldSequence = 0

/**
 * Points the label, hint and error at the control this field wraps.
 *
 * Without this the label was a *sibling* of the control with no `for` and nothing wrapping it, so
 * clicking it did nothing and a screen reader read the control unnamed - and `hint` and `error`
 * were never announced at all, which is most of what they are for.
 *
 * It can be done here, rather than pushed onto every caller, because velotype's JSX evaluates to
 * real DOM: `children` is already built by the time this runs, so the control can simply be looked
 * up. That is also why it is one traversal after the fact instead of a prop threaded through.
 *
 * ⚠️ **One control gets `for`; several get a group.** `for` names exactly one control, so pointing
 * a label at the first of a set - a radio group, `DateTimeRangePicker`'s two inputs - would name
 * that one and leave the rest anonymous. A wrapping `<label>` is worse again: wrapping more than
 * one control is invalid. So a field holding several controls becomes a labelled `group` instead,
 * which is the pattern those controls actually need.
 */
function associateLabel(root: HTMLElement, ids: {
    label: HTMLElement | null
    labelId: string
    hintId: string | null
    errorId: string | null
    required?: boolean
}): void {
    const controls = [...root.querySelectorAll("input, select, textarea")] as HTMLElement[]
    const describedBy = [ids.hintId, ids.errorId].filter((id) => id != null).join(" ")

    if (controls.length == 1) {
        const control = controls[0]
        if (!control.id) {
            control.id = `vtd-ff-control-${formFieldSequence}`
        }
        ids.label?.setAttribute("for", control.id)
        applyDescription(control, describedBy, ids)
        return
    }
    if (controls.length > 1) {
        root.setAttribute("role", "group")
        if (ids.label) {
            root.setAttribute("aria-labelledby", ids.labelId)
        }
        applyDescription(root, describedBy, ids)
    }
    // No control at all is a legitimate use - a field wrapping read-only text - and needs no wiring
}

function applyDescription(target: HTMLElement, describedBy: string, ids: {errorId: string | null, required?: boolean}): void {
    if (describedBy) {
        target.setAttribute("aria-describedby", describedBy)
    }
    if (ids.errorId) {
        target.setAttribute("aria-invalid", "true")
    }
    if (ids.required) {
        // `aria-required`, not the `required` attribute: the marker is the field's claim about
        // itself, and writing `required` here would switch on the browser's own validation and
        // block submit for a form that never asked for it
        target.setAttribute("aria-required", "true")
    }
}
