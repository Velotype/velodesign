import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"

/**
 * Attrs type for `<Textarea/>` Component
 */
export type TextareaAttrsType = {
    /** `name` for the `<textarea/>` tag */
    name?: string
    /** Initial value */
    value?: string
    /** Placeholder text */
    placeholder?: string
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Number of visible text lines (default: `3`) */
    rows?: number
    /** Maximum number of characters accepted */
    maxLength?: number
    /** How the `<textarea/>` may be resized by the user (default: `"vertical"`) */
    resize?: "none" | "vertical" | "horizontal" | "both"
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLTextAreaElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLTextAreaElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areTextareaStylesMounted = false

/** Stylesheet for `<Textarea/>`, mounted once on first construction */
const textareaCss: string = `
.vtd-textarea{
padding:0.5ex 1ex;
margin-inline-start:1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
}
`

/**
 * A multi-line input box accepting text input from the user
 */
export const Textarea: FunctionComponent<TextareaAttrsType> = function(attrs: TextareaAttrsType, _children: RenderableElements[]): HTMLTextAreaElement {
    if (!areTextareaStylesMounted) {
        areTextareaStylesMounted = true
        mountStyles(textareaCss, "vtd/Textarea")
    }

    return passthroughAttrsToElement<HTMLTextAreaElement>(<textarea
        class="vtd-textarea"
        name={attrs.name}
        value={attrs.value}
        rows={attrs.rows || 3}
        maxlength={attrs.maxLength}
        onInput={attrs.onInput}
        onChange={attrs.onChange}
        placeholder={attrs.placeholder}
        required={attrs.required}
        style={{resize: attrs.resize || "vertical"}}/>, attrs)
}
