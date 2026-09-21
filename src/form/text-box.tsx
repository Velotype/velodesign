import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { CommonThemeOptions } from "../core/theme-options.ts"

/**
 * The various types of TextBox Components
 */
export type TextBoxType = "password" | "new-password" | "text" | "email" | "phone"

/**
 * Attrs type for `<TextBox/>` Component
 */
export type TextBoxAttrsType = {
    /** Type of the input */
    type: TextBoxType
    /** `name` for the `<input/>` tag */
    name?: string
    /** Initial value */
    value?: string | number
    /** Placeholder text */
    placeholder?: string
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
    /**
     * Adds a control that empties the field, shown only while it has a value (default: `false`).
     *
     * **Off by default, deliberately.** This one component covers every kind of field - a name, an
     * email, a password - and most of them are typed once and submitted, where a clear button is
     * noise and on a password field arguably worse than that. It earns its place on a field the
     * reader edits repeatedly and abandons: a search or filter box. Those know who they are; the
     * others should not have to opt out.
     *
     * Turning it on wraps the input, so the rendered root becomes a `<span>` with the `<input>`
     * inside it. Target `.vtd-text-box` for the input either way - the class stays on the input.
     */
    clearable?: boolean
    /** Accessible name for that control. No default - the library doesn't assume a language */
    clearLabel?: string
} & IdAttr & StylePassthroughAttrs

let areTextBoxStylesMounted = false
/**
 * An input box accepting text input from the user
 */
export const TextBox: FunctionComponent<TextBoxAttrsType> = function(attrs: TextBoxAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areTextBoxStylesMounted) {
        areTextBoxStylesMounted = true
        mountStyles(
`
.vtd-text-box{
padding:0.5ex 1ex;
margin-inline-start:1ex;
}
` +
/* Only present when clearable is set - an unwrapped input is still the default shape */
`
.vtd-text-box-wrapper{position:relative;display:inline-flex;align-items:center;}
.vtd-text-box-wrapper .vtd-text-box{width:100%;box-sizing:border-box;padding-inline-end:2em;}
.vtd-text-box-clear{
position:absolute;
inset-inline-end:0.35em;
display:none;
align-items:center;
justify-content:center;
width:1.4em;
height:1.4em;
padding:0;
border:none;
border-radius:50%;
background:transparent;
color:var(--background-9);
cursor:pointer;
line-height:1;
}
` +
/* Shown only while there is something to clear - :placeholder-shown is false once a value exists,
   so the button needs no script to decide whether it belongs on screen */
`
.vtd-text-box-wrapper .vtd-text-box:not(:placeholder-shown) ~ .vtd-text-box-clear{display:inline-flex;}
.vtd-text-box-clear:hover{background-color:var(--background-2);color:var(--text);}
`, "vtd/TextBox")
    }

    let autocomplete = "off"
    if (attrs.type == "password" || attrs.type == "new-password") {
        if (attrs.type == "password") {
            autocomplete="current-password"
        } else if (attrs.type == "new-password") {
            autocomplete="new-password"
        }
        return passthroughAttrsToElement<HTMLInputElement>(<input
            class="vtd-text-box"
            name={attrs.name}
            type="password"
            onInput={attrs.onInput}
            onChange={attrs.onChange}
            value={attrs.value}
            autocomplete={autocomplete}
            placeholder={attrs.placeholder}
            required={attrs.required}/>, attrs)
    }
    let inputType: "text" | "email" | "tel" = "text"
    if (attrs.type == "email") {
        inputType = "email"
        autocomplete="email"
    } else if (attrs.type == "phone") {
        inputType = "tel"
        autocomplete="tel"
    }
    const input: HTMLInputElement = <input
        class="vtd-text-box"
        name={attrs.name}
        type={inputType}
        role="textbox"
        onInput={attrs.onInput}
        onChange={attrs.onChange}
        value={attrs.value}
        autocomplete={autocomplete}
        // The clear control decides whether to show itself from :placeholder-shown, which is only
        // ever false once the field has a value - and which needs a placeholder to exist at all.
        // A single space keeps that true without putting anything on screen.
        placeholder={attrs.clearable ? (attrs.placeholder ?? " ") : attrs.placeholder}
        required={attrs.required}/>
    if (!attrs.clearable) {
        return passthroughAttrsToElement<HTMLInputElement>(input, attrs)
    }

    const clear: HTMLButtonElement = <button
        type="button"
        class="vtd-text-box-clear"
        aria-label={attrs.clearLabel}
        // The pointer must not take focus off the input on its way to the button, or clearing a
        // field costs the reader their place in it
        onMouseDown={(event: MouseEvent) => { event.preventDefault() }}
        onClick={() => {
            input.value = ""
            // Both events, because a consumer may be listening for either - and neither fires on
            // its own when a value is set from script
            input.dispatchEvent(new Event("input", {bubbles: true}))
            input.dispatchEvent(new Event("change", {bubbles: true}))
            input.focus()
        }}><CommonThemeOptions.closeSymbol/></button>

    return passthroughAttrsToElement<HTMLElement>(<span class="vtd-text-box-wrapper">
        {input}
        {clear}
    </span>, attrs)
}
